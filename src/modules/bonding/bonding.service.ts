import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BondingSummary } from '../../entities/bonding-summary.entity';
import { CreateBondingSummaryDto } from './dto/create-bonding-summary.dto';

@Injectable()
export class BondingService {
  constructor(
    @InjectRepository(BondingSummary)
    private bondingSummaryRepository: Repository<BondingSummary>,
  ) {}

  async createSummary(createBondingSummaryDto: CreateBondingSummaryDto): Promise<any> {
    // Map DTO (snake_case) to Entity (camelCase)
    const bondingSummary = this.bondingSummaryRepository.create({
      timestamp: createBondingSummaryDto.timestamp,
      shift: createBondingSummaryDto.shift,
      group: createBondingSummaryDto.group,
      timeSlot: createBondingSummaryDto.time_slot,
      machine: createBondingSummaryDto.machine,
      kashift: createBondingSummaryDto.kashift,
      admin: createBondingSummaryDto.admin,
      customer: createBondingSummaryDto.customer,
      poNumber: createBondingSummaryDto.po_number,
      customerPo: createBondingSummaryDto.customer_po,
      sku: createBondingSummaryDto.sku,
      week: createBondingSummaryDto.week,
      quantityProduksi: createBondingSummaryDto.quantity_produksi,
    });
    
    const savedSummary = await this.bondingSummaryRepository.save(bondingSummary);

    return {
      success: true,
      message: 'Bonding summary created successfully',
      data: savedSummary,
    };
  }

  async getAllSummaries(): Promise<BondingSummary[]> {
    return await this.bondingSummaryRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getSummaryById(id: number): Promise<BondingSummary | null> {
    return await this.bondingSummaryRepository.findOne({
      where: { id },
    });
  }
}
