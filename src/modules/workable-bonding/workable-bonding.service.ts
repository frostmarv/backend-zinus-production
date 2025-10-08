import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class WorkableBondingService {
  constructor(private dataSource: DataSource) {}

  async getWorkableBonding(): Promise<any[]> {
    // View already sorted by shipToName, sku - no need to override
    const query = `SELECT * FROM v_workable_bonding`;
    const result = await this.dataSource.query(query);
    return result;
  }

  async getWorkableDetail(): Promise<any[]> {
    // View already sorted by shipToName, sku - no need to override
    const query = `SELECT * FROM v_workable_bonding_detail`;
    const result = await this.dataSource.query(query);
    return result;
  }
}
