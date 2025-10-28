import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class WorkableBondingService {
  constructor(private dataSource: DataSource) {}

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

  // 🔽 Dihapus: calculateProductionStatus — diganti dengan pendekatan baru

  async getWorkableBonding(): Promise<any[]> {
    // Ambil rencana produksi
    const plannedMap = new Map<string, number>();
    const planned = await this.getPlannedWeeks();
    for (const p of planned) {
      const key = `${p.shipToName}|${p.sku}|${p.week}`;
      plannedMap.set(key, Number(p.quantityOrder) || 0);
    }

    // Ambil data aktual TANPA agregasi is_hole
    const actualData = await this.dataSource.query(`
      SELECT 
        c.customer_name AS "shipToName",
        p.sku,
        poi.week_number AS "week",
        COALESCE(al.second_item_number, 'MAIN') AS "s_code",
        COALESCE(al.layer_index, 1) AS "layer_index",
        COALESCE(e.quantity_produksi, 0) AS "cutting_qty",
        COALESCE(e.quantity_produksi, 0) - COALESCE(ng.net_ng_qty, 0) AS "net_qty",
        e.foaming_date,
        e.foaming_date_completed,
        e.is_hole,
        e.quantity_hole,
        e.quantity_hole_remain,
        COALESCE(bs.bonding_qty, 0) AS "bonding_qty"
      FROM production_order_items poi
      JOIN production_orders po ON poi.order_order_id = po.order_id
      JOIN customers c ON po.customer_customer_id = c.customer_id
      JOIN products p ON poi.product_product_id = p.product_id
      LEFT JOIN assembly_layers al ON p.product_id = al.product_product_id
      LEFT JOIN production_cutting_entries e 
        ON p.sku = e.sku 
        AND poi.week_number::TEXT = e.week
        AND COALESCE(al.second_item_number, 'MAIN') = COALESCE(e.s_code, 'MAIN')
      LEFT JOIN (
        SELECT 
          br.sku,
          COALESCE(br.s_code, 'MAIN') AS s_code,
          GREATEST(SUM(br.ng_quantity) - COALESCE(SUM(rp.processed_qty), 0), 0) AS "net_ng_qty"
        FROM bonding_reject br
        LEFT JOIN replacement_progress rp 
          ON br.id = rp.bonding_reject_id 
          AND rp.status IN ('IN_PROGRESS', 'COMPLETED')
        WHERE br.status != 'CANCELLED'
        GROUP BY br.sku, COALESCE(br.s_code, 'MAIN')
      ) ng ON e.sku = ng.sku AND COALESCE(e.s_code, 'MAIN') = ng.s_code
      LEFT JOIN (
        SELECT sku, week, SUM(quantity_produksi) AS "bonding_qty"
        FROM bonding_summary
        GROUP BY sku, week
      ) bs ON p.sku = bs.sku AND poi.week_number::TEXT = bs.week
      WHERE poi.week_number IS NOT NULL AND p.category = 'FOAM'
        AND e.id IS NOT NULL
      ORDER BY c.customer_name, p.sku, poi.week_number, "layer_index"
    `);

    // Normalisasi data
    const normalizedData = actualData.map(row => ({
      ...row,
      cutting_qty: Number(row.cutting_qty) || 0,
      net_qty: Number(row.net_qty) || 0,
      bonding_qty: Number(row.bonding_qty) || 0,
      foaming_date: row.foaming_date || null,
      foaming_date_completed: Boolean(row.foaming_date_completed),
      is_hole: Boolean(row.is_hole),
      quantity_hole: Number(row.quantity_hole) || 0,
      quantity_hole_remain: Number(row.quantity_hole_remain) || 0,
      layer_index: Number(row.layer_index) || 1,
      quantityOrder: plannedMap.get(`${row.shipToName}|${row.sku}|${row.week}`) || 0,
    }));

    // Grup berdasarkan (shipToName, sku, week)
    const skuWeekGroups = new Map<string, any[]>();
    for (const row of normalizedData) {
      const key = `${row.shipToName}|${row.sku}|${row.week}`;
      if (!skuWeekGroups.has(key)) {
        skuWeekGroups.set(key, []);
      }
      skuWeekGroups.get(key)!.push(row);
    }

    const result: any[] = [];
    for (const [key, entries] of skuWeekGroups.entries()) {
      const [shipToName, sku, weekStr] = key.split('|');
      const week = Number(weekStr);
      const quantityOrder = entries[0]?.quantityOrder || 0;
      
      const totalBonding = entries.reduce((sum, e) => sum + e.bonding_qty, 0);
      const remainProduksi = quantityOrder - totalBonding;

      if (remainProduksi <= 0) {
        result.push({
          week,
          shipToName,
          sku,
          quantityOrder: this.formatNumberOrDash(quantityOrder),
          workable: '-',
          bonding: this.formatNumberOrDash(totalBonding),
          'Remain Produksi': '-',
          status: 'Completed',
          remarks: 'Bonding completed',
        });
        continue;
      }

      // Pisahkan entri berdasarkan kondisi
      const foamingEntries = entries.filter(e => e.foaming_date && !e.foaming_date_completed);
      const holeEntries = entries.filter(e => e.is_hole);
      const normalEntries = entries.filter(e => !e.foaming_date && !e.is_hole);

      const totalFoaming = foamingEntries.reduce((sum, e) => sum + e.cutting_qty, 0);
      const totalHoleRemain = holeEntries.reduce((sum, e) => sum + e.quantity_hole_remain, 0);
      const totalHoleQty = holeEntries.reduce((sum, e) => sum + e.quantity_hole, 0);

      // Hitung workable: min(net_qty) dari entri normal - totalBonding
      const netQtys = normalEntries.map(e => e.net_qty).filter(q => q > 0);
      const minNetQty = netQtys.length > 0 ? Math.min(...netQtys) : 0;
      const workable = Math.max(minNetQty - totalBonding, 0);

      // Bangun remarks
      const statuses: string[] = [];
      if (foamingEntries.length > 0) {
        const dateStr = new Date(foamingEntries[0].foaming_date).toLocaleString('id-ID');
        statuses.push(`Foaming Date: ${dateStr}`);
      }
      if (totalHoleRemain > 0) {
        statuses.push(`Hole Processing: ${totalHoleQty - totalHoleRemain}/${totalHoleQty} done`);
      }
      if (statuses.length === 0 && normalEntries.some(e => e.cutting_qty > 0)) {
        statuses.push('Cutting in progress');
      }
      if (statuses.length === 0) {
        statuses.push('Waiting for cutting');
      }

      const status = 
        totalFoaming > 0 || totalHoleRemain > 0 
          ? 'Halted'
          : normalEntries.some(e => e.cutting_qty > 0)
            ? 'Running'
            : 'Not Started';

      result.push({
        week,
        shipToName,
        sku,
        quantityOrder: this.formatNumberOrDash(quantityOrder),
        workable: this.formatNumberOrDash(workable),
        bonding: this.formatNumberOrDash(totalBonding),
        'Remain Produksi': this.formatNumberOrDash(remainProduksi),
        status,
        remarks: statuses.join(', '),
      });
    }

    return this.sortResult(result);
  }

  async getWorkableDetail(): Promise<any[]> {
    const plannedMap = new Map<string, number>();
    const planned = await this.getPlannedWeeks();
    for (const p of planned) {
      const key = `${p.shipToName}|${p.sku}|${p.week}`;
      plannedMap.set(key, Number(p.quantityOrder) || 0);
    }

    const actualData = await this.dataSource.query(`
      SELECT 
        c.customer_name AS "shipToName",
        p.sku,
        poi.week_number AS "week",
        COALESCE(al.second_item_number, 'MAIN') AS "s_code",
        COALESCE(al.layer_index, 1) AS "layer_index",
        COALESCE(e.quantity_produksi, 0) AS "cutting_qty",
        COALESCE(e.quantity_produksi, 0) - COALESCE(ng.net_ng_qty, 0) AS "net_qty",
        e.foaming_date,
        e.foaming_date_completed,
        e.is_hole,
        e.quantity_hole,
        e.quantity_hole_remain,
        COALESCE(bs.bonding_qty, 0) AS "bonding_qty"
      FROM production_order_items poi
      JOIN production_orders po ON poi.order_order_id = po.order_id
      JOIN customers c ON po.customer_customer_id = c.customer_id
      JOIN products p ON poi.product_product_id = p.product_id
      LEFT JOIN assembly_layers al ON p.product_id = al.product_product_id
      LEFT JOIN production_cutting_entries e 
        ON p.sku = e.sku 
        AND poi.week_number::TEXT = e.week
        AND COALESCE(al.second_item_number, 'MAIN') = COALESCE(e.s_code, 'MAIN')
      LEFT JOIN (
        SELECT 
          br.sku,
          COALESCE(br.s_code, 'MAIN') AS s_code,
          GREATEST(SUM(br.ng_quantity) - COALESCE(SUM(rp.processed_qty), 0), 0) AS "net_ng_qty"
        FROM bonding_reject br
        LEFT JOIN replacement_progress rp 
          ON br.id = rp.bonding_reject_id 
          AND rp.status IN ('IN_PROGRESS', 'COMPLETED')
        WHERE br.status != 'CANCELLED'
        GROUP BY br.sku, COALESCE(br.s_code, 'MAIN')
      ) ng ON e.sku = ng.sku AND COALESCE(e.s_code, 'MAIN') = ng.s_code
      LEFT JOIN (
        SELECT sku, week, SUM(quantity_produksi) AS "bonding_qty"
        FROM bonding_summary
        GROUP BY sku, week
      ) bs ON p.sku = bs.sku AND poi.week_number::TEXT = bs.week
      WHERE poi.week_number IS NOT NULL AND p.category = 'FOAM'
        AND e.id IS NOT NULL
      ORDER BY c.customer_name, p.sku, poi.week_number, "layer_index"
    `);

    const normalizedData = actualData.map(row => ({
      ...row,
      cutting_qty: Number(row.cutting_qty) || 0,
      net_qty: Number(row.net_qty) || 0,
      bonding_qty: Number(row.bonding_qty) || 0,
      foaming_date: row.foaming_date || null,
      foaming_date_completed: Boolean(row.foaming_date_completed),
      is_hole: Boolean(row.is_hole),
      quantity_hole: Number(row.quantity_hole) || 0,
      quantity_hole_remain: Number(row.quantity_hole_remain) || 0,
      layer_index: Number(row.layer_index) || 1,
      quantityOrder: plannedMap.get(`${row.shipToName}|${row.sku}|${row.week}`) || 0,
    }));

    const skuWeekGroups = new Map<string, any[]>();
    for (const row of normalizedData) {
      const key = `${row.shipToName}|${row.sku}|${row.week}`;
      if (!skuWeekGroups.has(key)) {
        skuWeekGroups.set(key, []);
      }
      skuWeekGroups.get(key)!.push(row);
    }

    const layerNames = { 1: 'Layer 1', 2: 'Layer 2', 3: 'Layer 3', 4: 'Layer 4' };
    const emptyLayers = { 'Layer 1': 0, 'Layer 2': 0, 'Layer 3': 0, 'Layer 4': 0 };
    const result: any[] = [];

    for (const [key, entries] of skuWeekGroups.entries()) {
      const [shipToName, sku, weekStr] = key.split('|');
      const week = Number(weekStr);
      const quantityOrder = entries[0]?.quantityOrder || 0;
      const totalBonding = entries.reduce((sum, e) => sum + e.bonding_qty, 0);
      const remainProduksi = quantityOrder - totalBonding;

      if (remainProduksi <= 0) continue;

      const foamingEntries = entries.filter(e => e.foaming_date && !e.foaming_date_completed);
      const holeEntries = entries.filter(e => e.is_hole);
      const normalEntries = entries.filter(e => !e.foaming_date && !e.is_hole);

      const totalFoaming = foamingEntries.reduce((sum, e) => sum + e.cutting_qty, 0);
      const totalHoleRemain = holeEntries.reduce((sum, e) => sum + e.quantity_hole_remain, 0);
      const totalHoleQty = holeEntries.reduce((sum, e) => sum + e.quantity_hole, 0);

      const netQtys = normalEntries.map(e => e.net_qty).filter(q => q > 0);
      const minNetQty = netQtys.length > 0 ? Math.min(...netQtys) : 0;
      const workable = Math.max(minNetQty - totalBonding, 0);

      // Hitung per layer
      const layerNet: Record<number, number> = {1:0,2:0,3:0,4:0};
      const layerBonding: Record<number, number> = {1:0,2:0,3:0,4:0};
      const layerHoleRemain: Record<number, number> = {1:0,2:0,3:0,4:0};

      for (const e of entries) {
        const idx = Math.min(Math.max(e.layer_index, 1), 4);
        layerBonding[idx] += e.bonding_qty;
        
        if (e.foaming_date && !e.foaming_date_completed) {
          continue;
        }
        
        if (e.is_hole) {
          layerHoleRemain[idx] += e.quantity_hole_remain;
        } else {
          layerNet[idx] = Math.max(layerNet[idx], e.net_qty);
        }
      }

      const layers: Record<string, string | number> = {...emptyLayers};
      for (let i = 1; i <= 4; i++) {
        const workableLayer = layerHoleRemain[i] === 0 
          ? Math.max(layerNet[i] - layerBonding[i], 0)
          : 0;
        layers[layerNames[i]] = this.formatNumberOrDash(workableLayer);
      }

      const statuses: string[] = [];
      if (foamingEntries.length > 0) {
        const dateStr = new Date(foamingEntries[0].foaming_date).toLocaleString('id-ID');
        statuses.push(`Foaming Date: ${dateStr}`);
      }
      if (totalHoleRemain > 0) {
        statuses.push(`Hole Processing: ${totalHoleQty - totalHoleRemain}/${totalHoleQty} done`);
      }
      if (statuses.length === 0 && normalEntries.some(e => e.cutting_qty > 0)) {
        statuses.push('Cutting in progress');
      }
      if (statuses.length === 0) {
        statuses.push('Waiting for cutting');
      }

      const status = 
        totalFoaming > 0 || totalHoleRemain > 0 
          ? 'Halted'
          : normalEntries.some(e => e.cutting_qty > 0)
            ? 'Running'
            : 'Not Started';

      result.push({
        shipToName,
        sku,
        week,
        quantityOrder: this.formatNumberOrDash(quantityOrder),
        ...layers,
        workable: this.formatNumberOrDash(workable),
        bonding: this.formatNumberOrDash(totalBonding),
        'Remain Produksi': this.formatNumberOrDash(remainProduksi),
        status,
        remarks: statuses.join(', '),
      });
    }

    return this.sortResult(result);
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
          quantityOrder: '-',
          'NG Layer 1': this.formatNumberOrDash(layerData[1].ng),
          'NG Layer 2': this.formatNumberOrDash(layerData[2].ng),
          'NG Layer 3': this.formatNumberOrDash(layerData[3].ng),
          'NG Layer 4': this.formatNumberOrDash(layerData[4].ng),
          'NG Hole': '-',
          'Replacement Layer 1': this.formatNumberOrDash(layerData[1].rep),
          'Replacement Layer 2': this.formatNumberOrDash(layerData[2].rep),
          'Replacement Layer 3': this.formatNumberOrDash(layerData[3].rep),
          'Replacement Layer 4': this.formatNumberOrDash(layerData[4].rep),
          'Replacement Hole': '-',
        });
      }
    }

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

  private sortResult(result: any[]): any[] {
    const statusPriority = {
      'Running': 1,
      'Halted': 2,
      'Completed': 3,
      'Not Started': 4,
    };
    return result.sort((a, b) => {
      const priorityA = statusPriority[a.status] ?? 5;
      const priorityB = statusPriority[b.status] ?? 5;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return (
        a.shipToName.localeCompare(b.shipToName, undefined, { sensitivity: 'base' }) ||
        a.sku.localeCompare(b.sku, undefined, { sensitivity: 'base' })
      );
    });
  }
}