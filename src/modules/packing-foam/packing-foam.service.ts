import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePackingFoamSummaryDto } from './dto/create-packing-foam-summary.dto';
import { UpdatePackingFoamSummaryDto } from './dto/update-packing-foam-summary.dto';
import { PackingFoamSummary } from './entities/packing-foam-summary.entity';

@Injectable()
export class PackingFoamService {
  constructor(
    @InjectRepository(PackingFoamSummary)
    private readonly repo: Repository<PackingFoamSummary>,
  ) {}

  async create(dto: CreatePackingFoamSummaryDto) {
    const timestampDate = new Date(dto.timestamp);
    if (isNaN(timestampDate.getTime())) {
      throw new BadRequestException('Invalid timestamp format');
    }

    const summary = this.repo.create({
      ...dto,
      timestamp: timestampDate,
    });

    return await this.repo.save(summary);
  }

  async findAll(): Promise<PackingFoamSummary[]> {
    return await this.repo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PackingFoamSummary> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException(`Summary dengan ID ${id} tidak ditemukan`);
    }
    return entity;
  }

  async update(id: string, dto: UpdatePackingFoamSummaryDto) {
    const existing = await this.findOne(id);

    const updateData: Partial<PackingFoamSummary> = {};

    // Handle field per field, konversi timestamp jika ada
    if (dto.timestamp !== undefined) {
      const timestampDate = new Date(dto.timestamp);
      if (isNaN(timestampDate.getTime())) {
        throw new BadRequestException('Invalid timestamp format');
      }
      updateData.timestamp = timestampDate;
    }

    // Assign field lainnya satu per satu
    if (dto.shift !== undefined) updateData.shift = dto.shift;
    if (dto.group !== undefined) updateData.group = dto.group;
    if (dto.time_slot !== undefined) updateData.timeSlot = dto.time_slot;
    if (dto.machine !== undefined) updateData.machine = dto.machine;
    if (dto.kashift !== undefined) updateData.kashift = dto.kashift;
    if (dto.admin !== undefined) updateData.admin = dto.admin;
    if (dto.customer !== undefined) updateData.customer = dto.customer;
    if (dto.po_number !== undefined) updateData.poNumber = dto.po_number;
    if (dto.customer_po !== undefined) updateData.customerPo = dto.customer_po;
    if (dto.sku !== undefined) updateData.sku = dto.sku;
    if (dto.week !== undefined) updateData.week = dto.week;
    if (dto.quantity_produksi !== undefined) updateData.quantityProduksi = dto.quantity_produksi;

    await this.repo.update(id, updateData);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Summary dengan ID ${id} tidak ditemukan`);
    }
  }
}