// src/modules/bonding-reject/bonding-reject.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import {
  BondingReject,
  BondingRejectStatus,
  ImageMetadata,
} from './entities/bonding-reject.entity';
import { CreateBondingRejectDto } from './dto/create-bonding-reject.dto';
import { UpdateBondingRejectDto } from './dto/update-bonding-reject.dto';
import dayjs from 'dayjs';

@Injectable()
export class BondingRejectService {
  private readonly logger = new Logger(BondingRejectService.name);

  constructor(
    @InjectRepository(BondingReject)
    private readonly bondingRejectRepository: Repository<BondingReject>,
  ) {}

  async generateBatchNumber(shift: string, group: string): Promise<string> {
    const datePart = dayjs().format('YYYYMMDD');
    const prefix = `BND-${datePart}-${shift}-${group}`;

    const lastBatch = await this.bondingRejectRepository
      .createQueryBuilder('br')
      .where('br.batch_number LIKE :prefix', { prefix: `${prefix}-%` })
      .orderBy('br.batch_number', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastBatch) {
      const lastSequence = lastBatch.batch_number.split('-').pop();
      if (lastSequence) {
        sequence = parseInt(lastSequence, 10) + 1;
      }
    }

    const sequenceStr = sequence.toString().padStart(4, '0');
    return `${prefix}-${sequenceStr}`;
  }

  async create(createDto: CreateBondingRejectDto): Promise<BondingReject> {
    this.logger.log(
      `Creating bonding reject record for shift ${createDto.shift}, group ${createDto.group}`,
    );

    const batch_number = await this.generateBatchNumber(
      createDto.shift,
      createDto.group,
    );

    const bondingReject = this.bondingRejectRepository.create({
      batch_number,
      timestamp: new Date(createDto.timestamp),
      shift: createDto.shift,
      group: createDto.group,
      time_slot: createDto.time_slot,
      kashift: createDto.kashift,
      admin: createDto.admin,
      customer: createDto.customer,
      po_number: createDto.po_number,
      sku: createDto.sku,
      s_code: createDto.s_code,
      description: createDto.description ?? null,
      ng_quantity: createDto.ng_quantity,
      reason: createDto.reason,
      status: BondingRejectStatus.PENDING,
    });

    const saved = await this.bondingRejectRepository.save(bondingReject);
    this.logger.log(
      `Created bonding reject with batch number: ${batch_number}`,
    );

    return saved;
  }

  async findAll(filters?: {
    shift?: string;
    group?: string;
    status?: BondingRejectStatus;
    startDate?: Date;
    endDate?: Date;
  }): Promise<BondingReject[]> {
    const query = this.bondingRejectRepository.createQueryBuilder('br');

    if (filters?.shift) {
      query.andWhere('br.shift = :shift', { shift: filters.shift });
    }

    if (filters?.group) {
      query.andWhere('br.group = :group', { group: filters.group });
    }

    if (filters?.status) {
      query.andWhere('br.status = :status', { status: filters.status });
    }

    if (filters?.startDate) {
      query.andWhere('br.timestamp >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      query.andWhere('br.timestamp <= :endDate', { endDate: filters.endDate });
    }

    query.orderBy('br.timestamp', 'DESC');

    return await query.getMany();
  }

  async findOne(id: string): Promise<BondingReject> {
    const bondingReject = await this.bondingRejectRepository.findOne({
      where: { id },
    });

    if (!bondingReject) {
      throw new NotFoundException(`Bonding reject with ID ${id} not found`);
    }

    return bondingReject;
  }

  async findByBatchNumber(batch_number: string): Promise<BondingReject> {
    const bondingReject = await this.bondingRejectRepository.findOne({
      where: { batch_number },
    });

    if (!bondingReject) {
      throw new NotFoundException(
        `Bonding reject with batch number ${batch_number} not found`,
      );
    }

    return bondingReject;
  }

  async update(
    id: string,
    updateDto: UpdateBondingRejectDto,
  ): Promise<BondingReject> {
    const bondingReject = await this.findOne(id);
    Object.assign(bondingReject, updateDto);
    const updated = await this.bondingRejectRepository.save(bondingReject);
    this.logger.log(`Updated bonding reject ${id}, status: ${updated.status}`);
    return updated;
  }

  async updateStatus(
    id: string,
    status: BondingRejectStatus,
  ): Promise<BondingReject> {
    const bondingReject = await this.findOne(id);
    bondingReject.status = status;
    const updated = await this.bondingRejectRepository.save(bondingReject);
    this.logger.log(`Updated bonding reject ${id} status to ${status}`);
    return updated;
  }

  async addImages(id: string, images: ImageMetadata[]): Promise<BondingReject> {
    const bondingReject = await this.findOne(id);
    if (!bondingReject.images) {
      bondingReject.images = [];
    }
    bondingReject.images.push(...images);
    const updated = await this.bondingRejectRepository.save(bondingReject);
    this.logger.log(`Added ${images.length} images to bonding reject ${id}`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const bondingReject = await this.findOne(id);
    await this.bondingRejectRepository.remove(bondingReject);
    this.logger.log(`Deleted bonding reject ${id}`);
  }
}