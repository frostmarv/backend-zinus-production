// src/modules/replacement/replacement.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ReplacementProgress,
  ReplacementStatus,
  DepartmentType,
} from './entities/replacement-progress.entity';
import { CreateReplacementDto } from './dto/create-replacement.dto';
import { UpdateReplacementDto } from './dto/update-replacement.dto';

@Injectable()
export class ReplacementService {
  private readonly logger = new Logger(ReplacementService.name);

  constructor(
    @InjectRepository(ReplacementProgress)
    private readonly replacementRepository: Repository<ReplacementProgress>,
  ) {}

  async createRequest(
    createDto: CreateReplacementDto,
  ): Promise<ReplacementProgress> {
    this.logger.log(
      `Creating replacement request from ${createDto.sourceDept} to ${createDto.targetDept}, batch: ${createDto.sourceBatchNumber}`,
    );

    const replacement = this.replacementRepository.create({
      ...createDto,
      processedQty: 0,
      status: ReplacementStatus.PENDING,
    });

    const saved = await this.replacementRepository.save(replacement);
    this.logger.log(`Created replacement request with ID: ${saved.id}`);

    return saved;
  }

  async findAll(filters?: {
    sourceDept?: DepartmentType;
    targetDept?: DepartmentType;
    sourceBatchNumber?: string;
    status?: ReplacementStatus;
  }): Promise<ReplacementProgress[]> {
    const query = this.replacementRepository
      .createQueryBuilder('rp')
      .leftJoinAndSelect('rp.bondingReject', 'br');

    if (filters?.sourceDept) {
      query.andWhere('rp.source_dept = :sourceDept', {
        sourceDept: filters.sourceDept,
      });
    }

    if (filters?.targetDept) {
      query.andWhere('rp.target_dept = :targetDept', {
        targetDept: filters.targetDept,
      });
    }

    if (filters?.sourceBatchNumber) {
      query.andWhere('rp.source_batch_number = :sourceBatchNumber', {
        sourceBatchNumber: filters.sourceBatchNumber,
      });
    }

    if (filters?.status) {
      query.andWhere('rp.status = :status', { status: filters.status });
    }

    query.orderBy('rp.created_at', 'DESC');

    return await query.getMany();
  }

  async findOne(id: string): Promise<ReplacementProgress> {
    const replacement = await this.replacementRepository.findOne({
      where: { id },
      relations: ['bondingReject'],
    });

    if (!replacement) {
      throw new NotFoundException(`Replacement with ID ${id} not found`);
    }

    return replacement;
  }

  async update(
    id: string,
    updateDto: UpdateReplacementDto,
  ): Promise<ReplacementProgress> {
    const replacement = await this.findOne(id);

    if (updateDto.processedQty !== undefined) {
      if (updateDto.processedQty > replacement.requestedQty) {
        throw new BadRequestException(
          `Processed quantity (${updateDto.processedQty}) cannot exceed requested quantity (${replacement.requestedQty})`,
        );
      }

      if (updateDto.processedQty === 0) {
        updateDto.status = ReplacementStatus.PENDING;
      } else if (updateDto.processedQty < replacement.requestedQty) {
        updateDto.status = ReplacementStatus.IN_PROGRESS;
      } else if (updateDto.processedQty === replacement.requestedQty) {
        updateDto.status = ReplacementStatus.COMPLETED;
      }
    }

    Object.assign(replacement, updateDto);

    const updated = await this.replacementRepository.save(replacement);
    this.logger.log(
      `Updated replacement ${id}, processed: ${updated.processedQty}/${updated.requestedQty}, status: ${updated.status}`,
    );

    return updated;
  }

  async updateProcessedQty(
    id: string,
    processedQty: number,
  ): Promise<ReplacementProgress> {
    return this.update(id, { processedQty });
  }

  async updateStatus(
    id: string,
    status: ReplacementStatus,
  ): Promise<ReplacementProgress> {
    const replacement = await this.findOne(id);
    replacement.status = status;

    const updated = await this.replacementRepository.save(replacement);
    this.logger.log(`Updated replacement ${id} status to ${status}`);

    return updated;
  }

  async remove(id: string): Promise<void> {
    const replacement = await this.findOne(id);
    await this.replacementRepository.remove(replacement);
    this.logger.log(`Deleted replacement ${id}`);
  }

  async getStatistics(filters?: {
    sourceDept?: DepartmentType;
    targetDept?: DepartmentType;
    startDate?: Date;
    endDate?: Date;
  }) {
    const query = this.replacementRepository.createQueryBuilder('rp');

    if (filters?.sourceDept) {
      query.andWhere('rp.source_dept = :sourceDept', {
        sourceDept: filters.sourceDept,
      });
    }

    if (filters?.targetDept) {
      query.andWhere('rp.target_dept = :targetDept', {
        targetDept: filters.targetDept,
      });
    }

    if (filters?.startDate) {
      query.andWhere('rp.created_at >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      query.andWhere('rp.created_at <= :endDate', { endDate: filters.endDate });
    }

    const [total, pending, inProgress, completed, cancelled] =
      await Promise.all([
        query.getCount(),
        query
          .clone()
          .andWhere('rp.status = :status', {
            status: ReplacementStatus.PENDING,
          })
          .getCount(),
        query
          .clone()
          .andWhere('rp.status = :status', {
            status: ReplacementStatus.IN_PROGRESS,
          })
          .getCount(),
        query
          .clone()
          .andWhere('rp.status = :status', {
            status: ReplacementStatus.COMPLETED,
          })
          .getCount(),
        query
          .clone()
          .andWhere('rp.status = :status', {
            status: ReplacementStatus.CANCELLED,
          })
          .getCount(),
      ]);

    const totalRequested = await query
      .select('SUM(rp.requested_qty)', 'sum')
      .getRawOne()
      .then((result) => parseInt(result.sum) || 0);

    const totalProcessed = await query
      .select('SUM(rp.processed_qty)', 'sum')
      .getRawOne()
      .then((result) => parseInt(result.sum) || 0);

    return {
      total,
      byStatus: {
        pending,
        inProgress,
        completed,
        cancelled,
      },
      quantities: {
        totalRequested,
        totalProcessed,
        remaining: totalRequested - totalProcessed,
      },
    };
  }
}