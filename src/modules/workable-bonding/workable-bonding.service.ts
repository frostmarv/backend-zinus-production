// src/modules/workable-bonding/workable-bonding.service.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class WorkableBondingService {
  constructor(private dataSource: DataSource) {}

  async getWorkableBonding(): Promise<any[]> {
    const query = `SELECT * FROM v_workable_bonding`;
    return await this.dataSource.query(query);
  }

  async getWorkableDetail(): Promise<any[]> {
    const query = `SELECT * FROM v_workable_bonding_detail`;
    return await this.dataSource.query(query);
  }

  async getWorkableReject(): Promise<any[]> {
    const query = `SELECT * FROM v_workable_bonding_ng`;
    return await this.dataSource.query(query);
  }
}
