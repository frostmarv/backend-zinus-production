// src/modules/bonding/workable-bonding.service.ts
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

  private async getAllWeekData() {
    const planned = await this.getPlannedWeeks();

    // Build full planned map: key = shipTo|sku|week
    const plannedMap = new Map<string, number>();
    const plannedByWeek = new Map<number, any[]>();
    const skuWeekToShipTo = new Map<string, string>(); // 👈 mapping untuk bonding

    for (const p of planned) {
      const key = `${p.shipToName}|${p.sku}|${p.week}`;
      const qty = Number(p.quantityOrder) || 0;
      plannedMap.set(key, qty);
      if (!plannedByWeek.has(p.week)) plannedByWeek.set(p.week, []);
      plannedByWeek.get(p.week)!.push({ ...p, quantityOrder: qty });

      // Simpan mapping sku+week -> shipTo (asumsi 1 SKU = 1 customer per week)
      const skuWeekKey = `${p.sku}|${p.week}`;
      if (!skuWeekToShipTo.has(skuWeekKey)) {
        skuWeekToShipTo.set(skuWeekKey, p.shipToName);
      }
    }

    // Ambil data cutting — tetap valid
    const cuttingEntries = await this.dataSource.query(`
      SELECT 
        c.customer_name AS "shipToName",
        e.sku,
        e.week,
        COALESCE(e.s_code, 'MAIN') AS "s_code",
        COALESCE(al.layer_index, 1) AS "layer_index",
        e.quantity_produksi AS "cutting_qty",
        e.quantity_produksi - COALESCE(ng.net_ng_qty, 0) AS "net_qty",
        e.foaming_date,
        e.foaming_date_completed,
        e.is_hole,
        e.quantity_hole,
        e.quantity_hole_remain
      FROM production_cutting_entries e
      JOIN products p ON e.sku = p.sku
      JOIN production_order_items poi ON p.product_id = poi.product_product_id AND poi.week_number::TEXT = e.week
      JOIN production_orders po ON poi.order_order_id = po.order_id
      JOIN customers c ON po.customer_customer_id = c.customer_id
      LEFT JOIN assembly_layers al ON p.product_id = al.product_product_id 
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
      WHERE p.category = 'FOAM' AND e.week IS NOT NULL
      ORDER BY c.customer_name, e.sku, e.week, "layer_index"
    `);

    // ✅ Ambil bonding data MENTAH (tanpa JOIN ilegal)
    const rawBondingData = await this.dataSource.query(`
      SELECT sku, week, SUM(quantity_produksi) AS total
      FROM bonding_summary
      GROUP BY sku, week
    `);

    // Bangun bondingMap dengan shipToName dari mapping
    const bondingMap = new Map<string, number>();
    for (const row of rawBondingData) {
      const skuWeekKey = `${row.sku}|${row.week}`;
      const shipToName = skuWeekToShipTo.get(skuWeekKey);
      if (shipToName) {
        const fullKey = `${shipToName}|${row.sku}|${row.week}`;
        bondingMap.set(fullKey, Number(row.total) || 0);
      }
      // Jika tidak ada mapping, abaikan (tidak ada planned order)
    }

    // Normalisasi cutting entries
    const normalizedEntries = cuttingEntries.map(row => ({
      shipToName: row.shipToName,
      sku: row.sku,
      week: Number(row.week),
      s_code: row.s_code,
      layer_index: Number(row.layer_index) || 1,
      cutting_qty: Number(row.cutting_qty) || 0,
      net_qty: Number(row.net_qty) || 0,
      foaming_date: row.foaming_date || null,
      foaming_date_completed: Boolean(row.foaming_date_completed),
      is_hole: Boolean(row.is_hole),
      quantity_hole: Number(row.quantity_hole) || 0,
      quantity_hole_remain: Number(row.quantity_hole_remain) || 0,
    }));

    // Grup cutting entries by key
    const cuttingGroups = new Map<string, any[]>();
    for (const entry of normalizedEntries) {
      const key = `${entry.shipToName}|${entry.sku}|${entry.week}`;
      if (!cuttingGroups.has(key)) cuttingGroups.set(key, []);
      cuttingGroups.get(key)!.push(entry);
    }

    // Bangun data lengkap per planned item
    const allItems: any[] = [];
    for (const [key, qtyOrder] of plannedMap.entries()) {
      const [shipToName, sku, weekStr] = key.split('|');
      const week = Number(weekStr);
      const entries = cuttingGroups.get(key) || [];
      const totalBonding = bondingMap.get(key) || 0; // ✅ Gunakan key lengkap
      const remainProduksi = qtyOrder - totalBonding;
      const isCompleted = remainProduksi <= 0;

      // Hitung status & remarks
      const foamingEntries = entries.filter(e => e.foaming_date && !e.foaming_date_completed);
      const holeEntries = entries.filter(e => e.is_hole);
      const normalEntries = entries.filter(e => !e.foaming_date && !e.is_hole);

      const totalFoaming = foamingEntries.reduce((sum, e) => sum + e.cutting_qty, 0);
      const totalHoleRemain = holeEntries.reduce((sum, e) => sum + e.quantity_hole_remain, 0);
      const totalHoleQty = holeEntries.reduce((sum, e) => sum + e.quantity_hole, 0);

      const netQtys = normalEntries.map(e => e.net_qty).filter(q => q > 0);
      const minNetQty = netQtys.length > 0 ? Math.min(...netQtys) : 0;
      const workable = Math.max(minNetQty - totalBonding, 0);

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
        isCompleted 
          ? 'Completed'
          : totalFoaming > 0 || totalHoleRemain > 0 
            ? 'Halted'
            : normalEntries.some(e => e.cutting_qty > 0)
              ? 'Running'
              : 'Not Started';

      allItems.push({
        week,
        shipToName,
        sku,
        quantityOrder: qtyOrder,
        workable,
        bonding: totalBonding,
        remainProduksi,
        status,
        remarks: statuses.join(', '),
        entries,
      });
    }

    return { allItems, plannedByWeek };
  }

  async getWorkableBonding(): Promise<any[]> {
    const { allItems, plannedByWeek } = await this.getAllWeekData();
    if (allItems.length === 0) return [];

    allItems.sort((a, b) => a.week - b.week || a.shipToName.localeCompare(b.shipToName) || a.sku.localeCompare(b.sku));

    const sortedWeeks = Array.from(plannedByWeek.keys()).sort((a, b) => a - b);
    const firstWeek = sortedWeeks[0];
    if (firstWeek === undefined) return [];

    const initialItems = allItems.filter(item => item.week === firstWeek);
    const initialCount = initialItems.length;
    const completedInFirstWeek = initialItems.filter(item => item.status === 'Completed').length;

    let targetWeek: number;
    let targetItemCount: number;

    if (completedInFirstWeek === 0) {
      targetWeek = firstWeek;
      targetItemCount = initialCount;
    } else {
      targetWeek = firstWeek + 1;
      targetItemCount = completedInFirstWeek;
    }

    const itemsInTargetWeek = allItems
      .filter(item => item.week === targetWeek)
      .sort((a, b) => a.shipToName.localeCompare(b.shipToName) || a.sku.localeCompare(b.sku))
      .slice(0, targetItemCount);

    const remainingFromFirstWeek = initialItems.filter(item => item.status !== 'Completed');
    const combined = [...remainingFromFirstWeek, ...itemsInTargetWeek];

    const result = combined.map(item => ({
      week: item.week,
      shipToName: item.shipToName,
      sku: item.sku,
      quantityOrder: this.formatNumberOrDash(item.quantityOrder),
      workable: this.formatNumberOrDash(item.workable),
      bonding: this.formatNumberOrDash(item.bonding),
      'Remain Produksi': this.formatNumberOrDash(item.remainProduksi),
      status: item.status,
      remarks: item.remarks || '-',
    }));

    return this.sortResult(result);
  }

  async getWorkableDetail(): Promise<any[]> {
    const { allItems, plannedByWeek } = await this.getAllWeekData();
    if (allItems.length === 0) return [];

    allItems.sort((a, b) => a.week - b.week || a.shipToName.localeCompare(b.shipToName) || a.sku.localeCompare(b.sku));

    const sortedWeeks = Array.from(plannedByWeek.keys()).sort((a, b) => a - b);
    const firstWeek = sortedWeeks[0];
    if (firstWeek === undefined) return [];

    const initialItems = allItems.filter(item => item.week === firstWeek);
    const initialCount = initialItems.length;
    const completedInFirstWeek = initialItems.filter(item => item.status === 'Completed').length;

    let targetWeek: number;
    let targetItemCount: number;

    if (completedInFirstWeek === 0) {
      targetWeek = firstWeek;
      targetItemCount = initialCount;
    } else {
      targetWeek = firstWeek + 1;
      targetItemCount = completedInFirstWeek;
    }

    const itemsInTargetWeek = allItems
      .filter(item => item.week === targetWeek)
      .sort((a, b) => a.shipToName.localeCompare(b.shipToName) || a.sku.localeCompare(b.sku))
      .slice(0, targetItemCount);

    const remainingFromFirstWeek = initialItems.filter(item => item.status !== 'Completed');
    const combined = [...remainingFromFirstWeek, ...itemsInTargetWeek];

    const layerNames = { 1: 'Layer 1', 2: 'Layer 2', 3: 'Layer 3', 4: 'Layer 4' };
    const emptyLayers = { 'Layer 1': 0, 'Layer 2': 0, 'Layer 3': 0, 'Layer 4': 0 };
    const result: any[] = [];

    for (const item of combined) {
      const { entries, quantityOrder, bonding: totalBonding, remainProduksi, status, remarks } = item;

      const layerNet: Record<number, number> = {1:0,2:0,3:0,4:0};
      const layerHoleRemain: Record<number, number> = {1:0,2:0,3:0,4:0};

      for (const e of entries) {
        const idx = Math.min(Math.max(e.layer_index, 1), 4);
        if (e.foaming_date && !e.foaming_date_completed) continue;
        if (e.is_hole) {
          layerHoleRemain[idx] += e.quantity_hole_remain;
        } else {
          layerNet[idx] = Math.max(layerNet[idx], e.net_qty);
        }
      }

      const layers: Record<string, string | number> = {...emptyLayers};
      for (let i = 1; i <= 4; i++) {
        const workableLayer = layerHoleRemain[i] === 0 
          ? Math.max(layerNet[i] - totalBonding, 0)
          : 0;
        layers[layerNames[i]] = this.formatNumberOrDash(workableLayer);
      }

      result.push({
        shipToName: item.shipToName,
        sku: item.sku,
        week: item.week,
        quantityOrder: this.formatNumberOrDash(quantityOrder),
        ...layers,
        workable: this.formatNumberOrDash(item.workable),
        bonding: this.formatNumberOrDash(totalBonding),
        'Remain Produksi': this.formatNumberOrDash(remainProduksi),
        status,
        remarks: remarks || '-',
      });
    }

    return this.sortResult(result);
  }

  async getWorkableReject(): Promise<any[]> {
    const bondingData = await this.getWorkableBonding();
    if (bondingData.length === 0) return [];

    const activeWeeks = new Map<string, number>();
    for (const row of bondingData) {
      activeWeeks.set(`${row.shipToName}|${row.sku}`, row.week);
    }

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
        result.push({
          shipToName,
          sku,
          week: Number(week),
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