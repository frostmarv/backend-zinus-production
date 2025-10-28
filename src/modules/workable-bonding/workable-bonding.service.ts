import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class WorkableBondingService {
  constructor(private dataSource: DataSource) {}

  // 🔽 Helper: Format angka → "-" jika 0, null, undefined, atau NaN
  private formatNumberOrDash(value: any): string | number {
    const num = Number(value);
    if (isNaN(num) || num === 0) {
      return '-';
    }
    return num;
  }

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
        quantityOrder: Number(p.quantityOrder) || 0,
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
        item.cutting_qty = Number(item.cutting_qty) || 0;
        item.net_qty = Number(item.net_qty) || 0;
        item.bonding_qty = Number(item.bonding_qty) || 0;
        item.foaming_date = item.foaming_date || null;
        item.foaming_date_completed = Boolean(item.foaming_date_completed);
        item.is_hole = Boolean(item.is_hole);
        item.quantity_hole = Number(item.quantity_hole) || 0;
        item.quantity_hole_remain = Number(item.quantity_hole_remain) || 0;
        item.layer_index = Number(item.layer_index) || 1;
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
        const totalBonding = w.entries.reduce((sum, e) => sum + (Number(e.bonding_qty) || 0), 0);
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
          .map((e) => Number(e.net_qty) || 0)
          .filter((v) => typeof v === 'number' && !isNaN(v)) as number[];
        const minNetQty = netQtys.length > 0 ? Math.min(...netQtys) : 0;

        const totalBonding = allEntries.reduce((sum, e) => sum + (Number(e.bonding_qty) || 0), 0);
        const remainProduksi = Number(active.quantityOrder) - totalBonding;

        const totalHoleRemain = allEntries.reduce((sum, e) => {
          return sum + (Number(e.quantity_hole_remain) || 0);
        }, 0);

        const totalFoaming = allEntries.reduce((sum, e) => {
          if (e.foaming_date && !e.foaming_date_completed)
            return sum + (Number(e.cutting_qty) || 0);
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
              ? new Date(activeFoamingEntries[0].foaming_date).toLocaleString('id-ID')
              : 'TBD';
            statuses.push(`Foaming Date: ${foamingDateStr}`);
          }

          if (totalHoleRemain > 0) {
            const totalHoleQty = allEntries.reduce((sum, e) => {
              return sum + (Number(e.quantity_hole) || 0);
            }, 0);
            statuses.push(
              `Hole Processing: ${totalHoleQty - totalHoleRemain}/${totalHoleQty} done`,
            );
          }

          if (
            statuses.length === 0 &&
            allEntries.some((e) => (Number(e.cutting_qty) || 0) > 0 && !e.foaming_date && !e.is_hole)
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
          quantityOrder: this.formatNumberOrDash(active.quantityOrder),
          workable: this.formatNumberOrDash(workable),
          bonding: this.formatNumberOrDash(totalBonding),
          'Remain Produksi': this.formatNumberOrDash(remainProduksi),
          status:
            remainProduksi <= 0
              ? 'Completed'
              : totalFoaming > 0 || totalHoleRemain > 0
                ? 'Halted'
                : allEntries.some((e) => (Number(e.cutting_qty) || 0) > 0)
                  ? 'Running'
                  : 'Not Started',
          remarks: remarks || '-',
        });
      }
    }

    return result.sort((a, b) => {
      const statusPriority = {
        'Running': 1,
        'Halted': 2,
        'Completed': 3,
        'Not Started': 4,
      };
      const priorityA = statusPriority[a.status] ?? 5;
      const priorityB = statusPriority[b.status] ?? 5;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return (
        a.shipToName.localeCompare(b.shipToName, undefined, { sensitivity: 'base' }) ||
        a.sku.localeCompare(b.sku, undefined, { sensitivity: 'base' })
      );
    });
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
    };
    const emptyLayers = {
      'Layer 1': 0,
      'Layer 2': 0,
      'Layer 3': 0,
      'Layer 4': 0,
    };

    const result: any[] = [];
    for (const weeks of skuGroups.values()) {
      weeks.sort((a, b) => a.week - b.week);

      const active = weeks.find((w) => {
        const totalBonding = w.entries.reduce((sum, e) => sum + (Number(e.bonding_qty) || 0), 0);
        const remain = w.quantityOrder - totalBonding;
        return remain > 0;
      });

      if (active) {
        const allEntries = active.entries;

        const layerNetQtys: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
        const layerBondingQtys: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
        const layerHoleQtys: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

        for (const e of allEntries) {
          const layerIdx = Math.min(Math.max(Number(e.layer_index) || 1, 1), 4);
          layerBondingQtys[layerIdx] += (Number(e.bonding_qty) || 0);

          if (e.foaming_date && !e.foaming_date_completed) {
            continue;
          }

          if (e.is_hole) {
            layerHoleQtys[layerIdx] += (Number(e.quantity_hole_remain) || 0);
          } else {
            layerNetQtys[layerIdx] = Math.max(layerNetQtys[layerIdx], Number(e.net_qty) || 0);
          }
        }

        const layers: Record<string, string | number> = { ...emptyLayers };
        let minWorkable = Infinity;
        for (let idx = 1; idx <= 4; idx++) {
          const net = layerNetQtys[idx];
          const bonding = layerBondingQtys[idx];
          const holeRemain = layerHoleQtys[idx];
          const layerWorkable = holeRemain === 0 ? Math.max(net - bonding, 0) : 0;
          layers[layerNames[idx]] = this.formatNumberOrDash(layerWorkable);
          if (layerWorkable < minWorkable) minWorkable = layerWorkable;
        }

        const totalBonding = allEntries.reduce((sum, e) => sum + (Number(e.bonding_qty) || 0), 0);
        const remainProduksi = Number(active.quantityOrder) - totalBonding;
        const totalHoleRemain = Object.values(layerHoleQtys).reduce((sum, v) => sum + v, 0);
        const totalHoleProcessed = allEntries.reduce((sum, e) => {
          if (e.is_hole) return sum + ((Number(e.quantity_hole) || 0) - (Number(e.quantity_hole_remain) || 0));
          return sum;
        }, 0);
        const totalFoaming = allEntries.reduce((sum, e) => {
          if (e.foaming_date && !e.foaming_date_completed) return sum + (Number(e.cutting_qty) || 0);
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
              ? new Date(activeFoamingEntries[0].foaming_date).toLocaleString('id-ID')
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
            allEntries.some((e) => (Number(e.cutting_qty) || 0) > 0 && !e.foaming_date && !e.is_hole)
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
          quantityOrder: this.formatNumberOrDash(active.quantityOrder),
          ...layers,
          workable: this.formatNumberOrDash(minWorkable === Infinity ? 0 : minWorkable),
          bonding: this.formatNumberOrDash(totalBonding),
          'Remain Produksi': this.formatNumberOrDash(remainProduksi),
          status:
            remainProduksi <= 0
              ? 'Completed'
              : totalFoaming > 0 || totalHoleRemain > 0
                ? 'Halted'
                : allEntries.some((e) => (Number(e.cutting_qty) || 0) > 0)
                  ? 'Running'
                  : 'Not Started',
          remarks: remarks || '-',
        });
      }
    }

    return result.sort((a, b) => {
      const statusPriority = {
        'Running': 1,
        'Halted': 2,
        'Completed': 3,
        'Not Started': 4,
      };
      const priorityA = statusPriority[a.status] ?? 5;
      const priorityB = statusPriority[b.status] ?? 5;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return (
        a.shipToName.localeCompare(b.shipToName, undefined, { sensitivity: 'base' }) ||
        a.sku.localeCompare(b.sku, undefined, { sensitivity: 'base' })
      );
    });
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
      replMap.set(`${r.sku}|${r.s_code}`, Number(r.replacement_qty) || 0);
    }

    const layerIndexMap = new Map<string, number>();
    for (const l of layerMap) {
      layerIndexMap.set(`${l.sku}|${l.s_code}`, Number(l.layer_index) || 1);
    }

    const ngWithLayer: any[] = [];
    for (const ng of ngData) {
      const key = `${ng.sku}|${ng.s_code}`;
      const layer_index = layerIndexMap.get(key) || 1;
      const replacement_qty = replMap.get(key) || 0;
      ngWithLayer.push({
        sku: ng.sku,
        layer_index: Number(layer_index) || 1,
        ng_qty: Number(ng.ng_qty) || 0,
        replacement_qty: Number(replacement_qty) || 0,
      });
    }

    const result: any[] = [];
    const layerNameMap: Record<number, string> = {
      1: 'Layer 1',
      2: 'Layer 2',
      3: 'Layer 3',
      4: 'Layer 4',
    };

    for (const [skuKey, week] of activeWeeks) {
      const [shipToName, sku] = skuKey.split('|');
      const ngItems = ngWithLayer.filter((item) => item.sku === sku);
      if (ngItems.length === 0) {
        for (let layerIdx = 1; layerIdx <= 4; layerIdx++) {
          result.push({
            shipToName,
            sku,
            week: Number(week),
            layer_index: layerIdx,
            layer_name: layerNameMap[layerIdx],
            'NG Layer 1': '-',
            'NG Layer 2': '-',
            'NG Layer 3': '-',
            'NG Layer 4': '-',
            'NG Hole': '-',
            'Replacement Layer 1': '-',
            'Replacement Layer 2': '-',
            'Replacement Layer 3': '-',
            'Replacement Layer 4': '-',
            'Replacement Hole': '-',
          });
        }
      } else {
        // Kelompokkan per layer
        const layerData: Record<number, { ng: number; rep: number }> = {
          1: { ng: 0, rep: 0 },
          2: { ng: 0, rep: 0 },
          3: { ng: 0, rep: 0 },
          4: { ng: 0, rep: 0 },
        };

        for (const item of ngItems) {
          const idx = Math.min(Math.max(item.layer_index, 1), 4);
          layerData[idx].ng += item.ng_qty;
          layerData[idx].rep += item.replacement_qty;
        }

        result.push({
          shipToName,
          sku,
          week: Number(week),
          quantityOrder: '-', // Tidak ada di reject, jadi tetap '-'
          'NG Layer 1': this.formatNumberOrDash(layerData[1].ng),
          'NG Layer 2': this.formatNumberOrDash(layerData[2].ng),
          'NG Layer 3': this.formatNumberOrDash(layerData[3].ng),
          'NG Layer 4': this.formatNumberOrDash(layerData[4].ng),
          'NG Hole': '-', // Hole tidak dipisah di query ini → bisa diabaikan atau dihitung terpisah jika perlu
          'Replacement Layer 1': this.formatNumberOrDash(layerData[1].rep),
          'Replacement Layer 2': this.formatNumberOrDash(layerData[2].rep),
          'Replacement Layer 3': this.formatNumberOrDash(layerData[3].rep),
          'Replacement Layer 4': this.formatNumberOrDash(layerData[4].rep),
          'Replacement Hole': '-',
        });
      }
    }

    // Urutkan berdasarkan status dari bonding
    const bondingStatusMap = new Map<string, string>();
    for (const item of bondingData) {
      bondingStatusMap.set(`${item.shipToName}|${item.sku}`, item.status);
    }

    return result.sort((a, b) => {
      const statusA = bondingStatusMap.get(`${a.shipToName}|${a.sku}`) || 'Not Started';
      const statusB = bondingStatusMap.get(`${b.shipToName}|${b.sku}`) || 'Not Started';

      const statusPriority = {
        'Running': 1,
        'Halted': 2,
        'Completed': 3,
        'Not Started': 4,
      };
      const priorityA = statusPriority[statusA] ?? 5;
      const priorityB = statusPriority[statusB] ?? 5;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return (
        a.shipToName.localeCompare(b.shipToName, undefined, { sensitivity: 'base' }) ||
        a.sku.localeCompare(b.sku, undefined, { sensitivity: 'base' })
      );
    });
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
        COALESCE(ca.foaming_date_completed, FALSE) AS "foaming_date_completed",
        COALESCE(ca.is_hole, FALSE) AS "is_hole",
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
          BOOL_OR(e.foaming_date_completed) AS "foaming_date_completed",
          BOOL_OR(e.is_hole) AS "is_hole",
          SUM(e.quantity_hole) AS "quantity_hole",
          SUM(e.quantity_hole_remain) AS "quantity_hole_remain"
        FROM production_cutting_entries e
        LEFT JOIN (
          SELECT 
            br.sku,
            COALESCE(br.s_code, 'MAIN') AS s_code,
            GREATEST(br.ng_qty - COALESCE(rp.replacement_qty, 0), 0) AS "net_ng_qty"
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
        ) ng ON e.sku = ng.sku AND COALESCE(e.s_code, 'MAIN') = ng.s_code
        WHERE e.week IS NOT NULL
        GROUP BY e.sku, e.week, COALESCE(e.s_code, 'MAIN'), ng.net_ng_qty
      ) ca ON p.sku = ca.sku 
           AND poi.week_number::TEXT = ca.week
           AND COALESCE(al.second_item_number, 'MAIN') = ca."sCode"
      LEFT JOIN (
        SELECT sku, week, SUM(quantity_produksi) AS "bonding_qty"
        FROM bonding_summary
        GROUP BY sku, week
      ) bs ON p.sku = bs.sku 
           AND poi.week_number::TEXT = bs.week
      WHERE poi.week_number IS NOT NULL AND p.category = 'FOAM'
      ORDER BY c.customer_name, p.sku, poi.week_number, "layer_index"
    `);
  }
}