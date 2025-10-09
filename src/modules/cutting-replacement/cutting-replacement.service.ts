import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CuttingProcess, CuttingProcessStatus } from './entities/cutting-process.entity';
import { CreateCuttingProcessDto } from './dto/create-cutting-process.dto';
import { UpdateCuttingProcessDto } from './dto/update-cutting-process.dto';
import { ReplacementService } from '../replacement/replacement.service';
import { ReplacementStatus } from '../replacement/entities/replacement-progress.entity';

@Injectable()
export class CuttingReplacementService {
  private readonly logger = new Logger(CuttingReplacementService.name);

  constructor(
    @InjectRepository(CuttingProcess)
    private readonly cuttingProcessRepository: Repository<CuttingProcess>,
    private readonly replacementService: ReplacementService,
  ) {}

  async create(createDto: CreateCuttingProcessDto): Promise<CuttingProcess> {
    // Verify replacement exists
    const replacement = await this.replacementService.findOne(createDto.replacementId);

    if (replacement.status === ReplacementStatus.COMPLETED) {
      throw new BadRequestException('Replacement is already completed');
    }

    if (replacement.status === ReplacementStatus.CANCELLED) {
      throw new BadRequestException('Replacement is cancelled');
    }

    this.logger.log(`Creating cutting process for replacement ${createDto.replacementId}`);

    const cuttingProcess = this.cuttingProcessRepository.create({
      ...createDto,
      processedQty: createDto.processedQty || 0,
      status: CuttingProcessStatus.PENDING,
    });

    const saved = await this.cuttingProcessRepository.save(cuttingProcess);
    this.logger.log(`Created cutting process with ID: ${saved.id}`);

    return saved;
  }

  async findAll(filters?: {
    replacementId?: string;
    status?: CuttingProcessStatus;
  }): Promise<CuttingProcess[]> {
    const query = this.cuttingProcessRepository
      .createQueryBuilder('cp')
      .leftJoinAndSelect('cp.replacement', 'rp')
      .leftJoinAndSelect('rp.bondingReject', 'br');

    if (filters?.replacementId) {
      query.andWhere('cp.replacement_id = :replacementId', {
        replacementId: filters.replacementId,
      });
    }

    if (filters?.status) {
      query.andWhere('cp.status = :status', { status: filters.status });
    }

    query.orderBy('cp.created_at', 'DESC');

    return query.getMany();
  }

  async findOne(id: string): Promise<CuttingProcess> {
    const cuttingProcess = await this.cuttingProcessRepository.findOne({
      where: { id },
      relations: ['replacement', 'replacement.bondingReject'],
    });

    if (!cuttingProcess) {
      throw new NotFoundException(`Cutting process with ID ${id} not found`);
    }

    return cuttingProcess;
  }

  async processReplacement(
    replacementId: string,
    processedQty: number,
    operatorName?: string,
    machineId?: string,
  ): Promise<CuttingProcess> {
    const replacement = await this.replacementService.findOne(replacementId);

    if (processedQty > replacement.requestedQty) {
      throw new BadRequestException(
        `Processed quantity (${processedQty}) cannot exceed requested quantity (${replacement.requestedQty})`,
      );
    }

    // Check if cutting process already exists for this replacement
    let cuttingProcess = await this.cuttingProcessRepository.findOne({
      where: { replacementId },
    });

    if (!cuttingProcess) {
      // Create new cutting process
      cuttingProcess = await this.create({
        replacementId,
        processedQty,
        operatorName,
        machineId,
      });
    }

    // Update cutting process
    cuttingProcess.processedQty = processedQty;
    cuttingProcess.operatorName = operatorName || cuttingProcess.operatorName;
    cuttingProcess.machineId = machineId || cuttingProcess.machineId;

    if (processedQty === 0) {
      cuttingProcess.status = CuttingProcessStatus.PENDING;
      cuttingProcess.startedAt = null;
      cuttingProcess.completedAt = null;
    } else if (processedQty < replacement.requestedQty) {
      cuttingProcess.status = CuttingProcessStatus.IN_PROGRESS;
      if (!cuttingProcess.startedAt) {
        cuttingProcess.startedAt = new Date();
      }
    } else if (processedQty === replacement.requestedQty) {
      cuttingProcess.status = CuttingProcessStatus.COMPLETED;
      cuttingProcess.completedAt = new Date();
    }

    const updated = await this.cuttingProcessRepository.save(cuttingProcess);

    // Update replacement progress
    await this.replacementService.updateProcessedQty(replacementId, processedQty);

    this.logger.log(
      `Processed replacement ${replacementId}: ${processedQty}/${replacement.requestedQty}, status: ${updated.status}`,
    );

    return updated;
  }

  async update(id: string, updateDto: UpdateCuttingProcessDto): Promise<CuttingProcess> {
    const cuttingProcess = await this.findOne(id);

    // If processedQty is being updated, validate and sync with replacement
    if (updateDto.processedQty !== undefined) {
      const replacement = await this.replacementService.findOne(cuttingProcess.replacementId);

      if (updateDto.processedQty > replacement.requestedQty) {
        throw new BadRequestException(
          `Processed quantity (${updateDto.processedQty}) cannot exceed requested quantity (${replacement.requestedQty})`,
        );
      }

      // Update replacement progress
      await this.replacementService.updateProcessedQty(
        cuttingProcess.replacementId,
        updateDto.processedQty,
      );
    }

    Object.assign(cuttingProcess, updateDto);

    const updated = await this.cuttingProcessRepository.save(cuttingProcess);
    this.logger.log(`Updated cutting process ${id}, status: ${updated.status}`);

    return updated;
  }

  async updateStatus(id: string, status: CuttingProcessStatus): Promise<CuttingProcess> {
    const cuttingProcess = await this.findOne(id);
    cuttingProcess.status = status;

    if (status === CuttingProcessStatus.IN_PROGRESS && !cuttingProcess.startedAt) {
      cuttingProcess.startedAt = new Date();
    }

    if (status === CuttingProcessStatus.COMPLETED) {
      cuttingProcess.completedAt = new Date();
    }

    const updated = await this.cuttingProcessRepository.save(cuttingProcess);
    this.logger.log(`Updated cutting process ${id} status to ${status}`);

    return updated;
  }

  async remove(id: string): Promise<void> {
    const cuttingProcess = await this.findOne(id);
    await this.cuttingProcessRepository.remove(cuttingProcess);
    this.logger.log(`Deleted cutting process ${id}`);
  }

  async getStatistics(filters?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    const query = this.cuttingProcessRepository.createQueryBuilder('cp');

    if (filters?.startDate) {
      query.andWhere('cp.created_at >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('cp.created_at <= :endDate', { endDate: filters.endDate });
    }

    const [total, pending, inProgress, completed, failed] = await Promise.all([
      query.getCount(),
      query.clone().andWhere('cp.status = :status', { status: CuttingProcessStatus.PENDING }).getCount(),
      query.clone().andWhere('cp.status = :status', { status: CuttingProcessStatus.IN_PROGRESS }).getCount(),
      query.clone().andWhere('cp.status = :status', { status: CuttingProcessStatus.COMPLETED }).getCount(),
      query.clone().andWhere('cp.status = :status', { status: CuttingProcessStatus.FAILED }).getCount(),
    ]);

    const totalProcessed = await query
      .select('SUM(cp.processed_qty)', 'sum')
      .getRawOne()
      .then((result) => parseInt(result.sum) || 0);

    return {
      total,
      byStatus: {
        pending,
        inProgress,
        completed,
        failed,
      },
      totalProcessed,
    };
  }
}
