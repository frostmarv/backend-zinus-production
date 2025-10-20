// src/modules/workable-bonding/workable-bonding.service.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class WorkableBondingService {
  constructor(private dataSource: DataSource) {}

  private async getPlannedWeeks(): Promise<any[]> {
    return await this.dataSource.query(`
      SELECT 
        c.customer_name AS "shipToName",
        p.sku,
        poi.week_number AS "week",
        SUM(poi.planned_qty) AS "quantityOrder"
      FROM production_order_items poi
      JOIN production_orders po ON poi.order_order_id = po.order_id
      JOIN customers c ON po.customer_customer_id = c.customer_id
      JOIN products p ON poi.product_product_id = p.product_id
      WHERE poi.week_number IS NOT NULL AND p.category = 'FOAM'
      GROUP BY c.customer_name, p.sku, poi.week_number
      ORDER BY c.customer_name, p.sku, poi.week_number
    `);
  }

  private async calculateProductionStatus(): Promise<Map<string, any>> {
    const planned = await this.getPlannedWeeks();
    const skuWeekMap = new Map<string, any>();

    for (const p of planned) {
      const key = `${p.shipToName}|${p.sku}|${p.week}`;
      skuWeekMap.set(key, {
        shipToName: p.shipToName,
        sku: p.sku,
        week: p.week,
        quantityOrder: p.quantityOrder,
        entries: [] as any[],
      });
    }

    const actualData = await this.getRawWorkableData();
    for (const row of actualData) {
      const key = `${row.shipToName}|${row.sku}|${row.week}`;
      const existing = skuWeekMap.get(key);
      if (existing) {
        existing.entries.push(row);
      } else {
        skuWeekMap.set(key, {
          shipToName: row.shipToName,
          sku: row.sku,
          week: row.week,
          quantityOrder: 0,
          entries: [row],
        });
      }
    }

    for (const entry of skuWeekMap.values()) {
      for (const item of entry.entries) {
        item.cutting_qty = item.cutting_qty || 0;
        item.net_qty = item.net_qty || 0;
        item.bonding_qty = item.bonding_qty || 0;
        item.foaming_date = item.foaming_date || null;
        item.foaming_date_completed = item.foaming_date_completed || false;
        item.is_hole = item.is_hole || false;
        item.quantity_hole = item.quantity_hole || 0;
        item.quantity_hole_remain = item.quantity_hole_remain || 0;
      }
    }

    return skuWeekMap;
  }

  async getWorkableBonding(): Promise<any[]> {
    const statusMap = await this.calculateProductionStatus();
    const skuGroups = new Map<string, any[]>();

    for (const entry of statusMap.values()) {
      const key = `${entry.shipToName}|${entry.sku}`;
      if (!skuGroups.has(key)) skuGroups.set(key, []);
      skuGroups.get(key)!.push(entry);
    }

    const result: any[] = [];
    for (const weeks of skuGroups.values()) {
      weeks.sort((a, b) => a.week - b.week);

      const active = weeks.find((w) => {
        const totalBonding = w.entries.reduce(
          (sum, e) => sum + e.bonding_qty,
          0,
        );
        const remain = w.quantityOrder - totalBonding;
        return remain > 0;
      });

      if (active) {
        const allEntries = active.entries;

        const availableEntries = allEntries.filter((e) => {
          const isFoaming = e.foaming_date && !e.foaming_date_completed;
          const isHole = e.is_hole;
          return !isFoaming && !isHole;
        });

        const netQtys = availableEntries
          .map((e) => e.net_qty)
          .filter((v) => typeof v === 'number' && !isNaN(v)) as number[];
        const minNetQty = netQtys.length > 0 ? Math.min(...netQtys) : 0;

        const totalBonding = allEntries.reduce(
          (sum, e) => sum + e.bonding_qty,
          0,
        );
        const remainProduksi = active.quantityOrder - totalBonding;

        const totalHoleRemain = allEntries.reduce((sum, e) => {
          if (e.is_hole) return sum + e.quantity_hole_remain;
          return sum;
        }, 0);

        const totalFoaming = allEntries.reduce((sum, e) => {
          if (e.foaming_date && !e.foaming_date_completed)
            return sum + e.cutting_qty;
          return sum;
        }, 0);

        let workable = Math.max(minNetQty - totalBonding, 0);

        let remarks = '';
        if (remainProduksi <= 0) {
          remarks = 'Bonding completed';
        } else {
          const statuses = [];

          const activeFoamingEntries = allEntries.filter(
            (e) => e.foaming_date && !e.foaming_date_completed,
          );
          if (activeFoamingEntries.length > 0) {
            const foamingDateStr = activeFoamingEntries[0].foaming_date
              ? new Date(activeFoamingEntries[0].foaming_date).toLocaleString(
                  'id-ID',
                )
              : 'TBD';
            statuses.push(`Foaming Date: ${foamingDateStr}`);
          }

          if (totalHoleRemain > 0) {
            const totalHoleQty = allEntries.reduce((sum, e) => {
              if (e.is_hole) return sum + e.quantity_hole;
              return sum;
            }, 0);
            statuses.push(
              `Hole Processing: ${totalHoleQty - totalHoleRemain}/${totalHoleQty} done`,
            );
          }

          if (
            statuses.length === 0 &&
            allEntries.some(
              (e) => e.cutting_qty > 0 && !e.foaming_date && !e.is_hole,
            )
          ) {
            statuses.push('Cutting in progress');
          }

          if (statuses.length === 0) {
            statuses.push('Waiting for cutting');
          }

          remarks = statuses.join(', ');
        }

        result.push({
          week: active.week,
          shipToName: active.shipToName,
          sku: active.sku,
          quantityOrder: active.quantityOrder,
          workable,
          bonding: totalBonding,
          'Remain Produksi': remainProduksi,
          status:
            remainProduksi <= 0
              ? 'Completed'
              : totalFoaming > 0 || totalHoleRemain > 0
                ? 'Halted'
                : allEntries.some((e) => e.cutting_qty > 0)
                  ? 'Running'
                  : 'Not Started',
          remarks,
        });
      }
    }

    return result.sort(
      (a, b) =>
        a.shipToName.localeCompare(b.shipToName, undefined, {
          sensitivity: 'base',
        }) || a.sku.localeCompare(b.sku, undefined, { sensitivity: 'base' }),
    );
  }

  async getWorkableDetail(): Promise<any[]> {
    const statusMap = await this.calculateProductionStatus();
    const skuGroups = new Map<string, any[]>();

    for (const entry of statusMap.values()) {
      const key = `${entry.shipToName}|${entry.sku}`;
      if (!skuGroups.has(key)) skuGroups.set(key, []);
      skuGroups.get(key)!.push(entry);
    }

    const layerNames = {
      1: 'Layer 1',
      2: 'Layer 2',
      3: 'Layer 3',
      4: 'Layer 4',
      5: 'Hole',
    };
    const emptyLayers = {
      'Layer 1': 0,
      'Layer 2': 0,
      'Layer 3': 0,
      'Layer 4': 0,
      Hole: 0,
    };

    const result: any[] = [];
    for (const weeks of skuGroups.values()) {
      weeks.sort((a, b) => a.week - b.week);

      const active = weeks.find((w) => {
        const totalBonding = w.entries.reduce(
          (sum, e) => sum + e.bonding_qty,
          0,
        );
        const remain = w.quantityOrder - totalBonding;
        return remain > 0;
      });

      if (active) {
        const allEntries = active.entries;

        const layerNetQtys: Record<number, number> = {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        };
        const layerBondingQtys: Record<number, number> = {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        };
        const layerHoleQtys: Record<number, number> = {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        };

        for (const e of allEntries) {
          const layerIdx = e.layer_index || 1;

          if (e.is_hole) {
            layerHoleQtys[5] = (layerHoleQtys[5] || 0) + e.quantity_hole_remain;
          } else if (e.foaming_date && !e.foaming_date_completed) {
            continue;
          } else {
            layerNetQtys[layerIdx] = Math.max(
              layerNetQtys[layerIdx] || 0,
              e.net_qty,
            );
          }

          layerBondingQtys[layerIdx] =
            (layerBondingQtys[layerIdx] || 0) + e.bonding_qty;
        }

        const layers = { ...emptyLayers };
        for (const [idxStr, net] of Object.entries(layerNetQtys)) {
          const idx = Number(idxStr);
          if (idx === 5) continue;

          const bonding = layerBondingQtys[idx] || 0;
          const holeQty = layerHoleQtys[idx] || 0;

          let layerWorkable = 0;
          if (holeQty === 0) {
            layerWorkable = Math.max(net - bonding, 0);
          } else {
            layerWorkable = 0;
          }

          const layerName = layerNames[idx];
          if (layerName) layers[layerName] = layerWorkable;
        }

        layers['Hole'] = layerHoleQtys[5] || 0;

        const totalBonding = allEntries.reduce(
          (sum, e) => sum + e.bonding_qty,
          0,
        );
        const remainProduksi = active.quantityOrder - totalBonding;

        const totalHoleRemain = allEntries.reduce((sum, e) => {
          if (e.is_hole) return sum + e.quantity_hole_remain;
          return sum;
        }, 0);

        const totalHoleProcessed = allEntries.reduce((sum, e) => {
          if (e.is_hole)
            return sum + (e.quantity_hole - e.quantity_hole_remain);
          return sum;
        }, 0);

        const totalFoaming = allEntries.reduce((sum, e) => {
          if (e.foaming_date && !e.foaming_date_completed)
            return sum + e.cutting_qty;
          return sum;
        }, 0);

        let remarks = '';
        if (remainProduksi <= 0) {
          remarks = 'Bonding completed';
        } else {
          const statuses = [];

          const activeFoamingEntries = allEntries.filter(
            (e) => e.foaming_date && !e.foaming_date_completed,
          );
          if (activeFoamingEntries.length > 0) {
            const foamingDateStr = activeFoamingEntries[0].foaming_date
              ? new Date(activeFoamingEntries[0].foaming_date).toLocaleString(
                  'id-ID',
                )
              : 'TBD';
            statuses.push(`Foaming Date: ${foamingDateStr}`);
          }

          if (totalHoleRemain > 0) {
            statuses.push(
              `Hole Processing: ${totalHoleProcessed}/${totalHoleProcessed + totalHoleRemain} done`,
            );
          }

          if (
            statuses.length === 0 &&
            allEntries.some(
              (e) => e.cutting_qty > 0 && !e.foaming_date && !e.is_hole,
            )
          ) {
            statuses.push('Cutting in progress');
          }

          if (statuses.length === 0) {
            statuses.push('Waiting for cutting');
          }

          remarks = statuses.join(', ');
        }

        result.push({
          shipToName: active.shipToName,
          sku: active.sku,
          week: active.week,
          quantityOrder: active.quantityOrder,
          ...layers,
          workable: Math.max(
            Math.min(...Object.values(layers).filter((v, i) => i < 4)) -
              totalBonding,
            0,
          ),
          bonding: totalBonding,
          'Remain Produksi': remainProduksi,
          status:
            remainProduksi <= 0
              ? 'Completed'
              : totalFoaming > 0 || totalHoleRemain > 0
                ? 'Halted'
                : allEntries.some((e) => e.cutting_qty > 0)
                  ? 'Running'
                  : 'Not Started',
          remarks,
        });
      }
    }

    return result.sort(
      (a, b) =>
        a.shipToName.localeCompare(b.shipToName, undefined, {
          sensitivity: 'base',
        }) || a.sku.localeCompare(b.sku, undefined, { sensitivity: 'base' }),
    );
  }

  async getWorkableReject(): Promise<any[]> {
    const activeWeeks = new Map<string, number>();
    const bondingData = await this.getWorkableBonding();
    for (const row of bondingData) {
      activeWeeks.set(`${row.shipToName}|${row.sku}`, row.week);
    }

    if (activeWeeks.size === 0) return [];

    const ngData = await this.dataSource.query(`
      SELECT 
        br.sku,
        COALESCE(br.s_code, 'MAIN') AS s_code,
        SUM(br.ng_quantity) AS ng_qty
      FROM bonding_reject br
      WHERE br.status != 'CANCELLED'
      GROUP BY br.sku, COALESCE(br.s_code, 'MAIN')
    `);

    const replacementData = await this.dataSource.query(`
      SELECT 
        br.sku,
        COALESCE(br.s_code, 'MAIN') AS s_code,
        SUM(COALESCE(rp.processed_qty, 0)) AS replacement_qty
      FROM bonding_reject br
      LEFT JOIN replacement_progress rp 
        ON br.id = rp.bonding_reject_id
      WHERE br.status != 'CANCELLED'
        AND rp.status IN ('IN_PROGRESS', 'COMPLETED')
      GROUP BY br.sku, COALESCE(br.s_code, 'MAIN')
    `);

    const layerMap = await this.dataSource.query(`
      SELECT 
        p.sku,
        COALESCE(al.second_item_number, 'MAIN') AS s_code,
        COALESCE(al.layer_index, 1) AS layer_index
      FROM products p
      LEFT JOIN assembly_layers al ON p.product_id = al.product_product_id
      WHERE p.category = 'FOAM'
    `);

    const replMap = new Map<string, number>();
    for (const r of replacementData) {
      replMap.set(`${r.sku}|${r.s_code}`, r.replacement_qty);
    }

    const layerIndexMap = new Map<string, number>();
    for (const l of layerMap) {
      layerIndexMap.set(`${l.sku}|${l.s_code}`, l.layer_index);
    }

    const ngWithLayer: any[] = [];
    for (const ng of ngData) {
      const key = `${ng.sku}|${ng.s_code}`;
      const layer_index = layerIndexMap.get(key) || 1;
      const replacement_qty = replMap.get(key) || 0;
      ngWithLayer.push({
        sku: ng.sku,
        layer_index,
        ng_qty: ng.ng_qty,
        replacement_qty,
      });
    }

    const result: any[] = [];
    const layerNameMap: Record<number, string> = {
      1: 'Layer 1',
      2: 'Layer 2',
      3: 'Layer 3',
      4: 'Layer 4',
      5: 'Hole',
    };

    for (const [skuKey, week] of activeWeeks) {
      const [shipToName, sku] = skuKey.split('|');
      const ngItems = ngWithLayer.filter((item) => item.sku === sku);
      if (ngItems.length === 0) {
        for (const [layerIdx, layerName] of Object.entries(layerNameMap)) {
          result.push({
            shipToName,
            sku,
            week: Number(week),
            layer_index: Number(layerIdx),
            layer_name: layerName,
            ng_qty: 0,
            replacement_qty: 0,
            net_ng_qty: 0,
            adjusted_net_ng: 0,
          });
        }
      } else {
        for (const item of ngItems) {
          const net_ng_qty = item.ng_qty - item.replacement_qty;
          result.push({
            shipToName,
            sku,
            week: Number(week),
            layer_index: item.layer_index,
            layer_name:
              layerNameMap[item.layer_index] || `Layer ${item.layer_index}`,
            ng_qty: item.ng_qty,
            replacement_qty: item.replacement_qty,
            net_ng_qty,
            adjusted_net_ng: Math.max(net_ng_qty, 0),
          });
        }
      }
    }

    return result.sort(
      (a, b) =>
        a.shipToName.localeCompare(b.shipToName, undefined, {
          sensitivity: 'base',
        }) ||
        a.sku.localeCompare(b.sku, undefined, { sensitivity: 'base' }) ||
        a.week - b.week ||
        a.layer_index - b.layer_index,
    );
  }

  private async getRawWorkableData(): Promise<any[]> {
    return await this.dataSource.query(`
      SELECT 
        c.customer_name AS "shipToName",
        p.sku,
        poi.week_number AS "week",
        COALESCE(al.second_item_number, 'MAIN') AS "s_code",
        COALESCE(al.layer_index, 1) AS "layer_index",
        COALESCE(ca.cutting_qty, 0) AS "cutting_qty",
        COALESCE(ca.net_qty, 0) AS "net_qty",
        COALESCE(ca.foaming_date, NULL) AS "foaming_date",
        COALESCE(ca.foaming_date_completed, 0) AS "foaming_date_completed",
        COALESCE(ca.is_hole, 0) AS "is_hole",
        COALESCE(ca.quantity_hole, 0) AS "quantity_hole",
        COALESCE(ca.quantity_hole_remain, 0) AS "quantity_hole_remain",
        COALESCE(bs.bonding_qty, 0) AS "bonding_qty"
      FROM production_order_items poi
      JOIN production_orders po ON poi.order_order_id = po.order_id
      JOIN customers c ON po.customer_customer_id = c.customer_id
      JOIN products p ON poi.product_product_id = p.product_id
      LEFT JOIN assembly_layers al ON p.product_id = al.product_product_id
      LEFT JOIN (
        SELECT 
          e.sku,
          e.week,
          COALESCE(e.s_code, 'MAIN') AS "sCode",
          SUM(e.quantity_produksi) AS "cutting_qty",
          SUM(e.quantity_produksi) - COALESCE(ng.net_ng_qty, 0) AS "net_qty",
          MAX(e.foaming_date) AS "foaming_date",
          MAX(CASE WHEN e.foaming_date_completed = 1 THEN 1 ELSE 0 END) AS "foaming_date_completed",
          MAX(CASE WHEN e.is_hole = 1 THEN 1 ELSE 0 END) AS "is_hole",
          SUM(e.quantity_hole) AS "quantity_hole",
          SUM(e.quantity_hole_remain) AS "quantity_hole_remain"
        FROM production_cutting_entries e
        LEFT JOIN (
          SELECT 
            br.sku,
            COALESCE(br.s_code, 'MAIN') AS s_code,
            MAX(br.ng_qty - COALESCE(rp.replacement_qty, 0), 0) AS "net_ng_qty"
          FROM (
            SELECT br.sku, COALESCE(br.s_code, 'MAIN') AS s_code, SUM(br.ng_quantity) AS "ng_qty"
            FROM bonding_reject br
            WHERE br.status != 'CANCELLED'
            GROUP BY br.sku, COALESCE(br.s_code, 'MAIN')
          ) br
          LEFT JOIN (
            SELECT 
              br.sku,
              COALESCE(br.s_code, 'MAIN') AS s_code,
              SUM(COALESCE(rp.processed_qty, 0)) AS "replacement_qty"
            FROM bonding_reject br
            LEFT JOIN replacement_progress rp ON br.id = rp.bonding_reject_id
            WHERE br.status != 'CANCELLED' AND rp.status IN ('IN_PROGRESS', 'COMPLETED')
            GROUP BY br.sku, COALESCE(br.s_code, 'MAIN')
          ) rp ON br.sku = rp.sku AND br.s_code = rp.s_code
          GROUP BY br.sku, br.s_code
        ) ng ON e.sku = ng.sku AND COALESCE(e.s_code, 'MAIN') = ng.s_code
        WHERE e.week IS NOT NULL
        GROUP BY e.sku, e.week, COALESCE(e.s_code, 'MAIN'), ng.net_ng_qty
      ) ca ON p.sku = ca.sku AND poi.week_number = ca.week AND COALESCE(al.second_item_number, 'MAIN') = ca."sCode"
      LEFT JOIN (
        SELECT sku, week, SUM(quantity_produksi) AS "bonding_qty"
        FROM bonding_summary
        GROUP BY sku, week
      ) bs ON p.sku = bs.sku AND poi.week_number = bs.week
      WHERE poi.week_number IS NOT NULL AND p.category = 'FOAM'
      ORDER BY c.customer_name, p.sku, poi.week_number, "layer_index"
    `);
  }
}