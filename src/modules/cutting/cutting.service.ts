// src/modules/cutting/cutting.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { CuttingRecord } from './cutting.entity';
import { BalokEntity } from './balok.entity';
import { ActualEntity } from './actual.entity';
import { ProductionCuttingRecord } from './production-cutting.entity';
import { ProductionCuttingEntry } from './production-cutting-entry.entity';
import { CreateCuttingDto } from './dto/create-cutting.dto';
import { UpdateCuttingDto } from './dto/update-cutting.dto';
import { CreateProductionCuttingDto } from './dto/create-production-cutting.dto';

function parseNumber(value: any): number | null {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

@Injectable()
export class CuttingService {
  constructor(
    @InjectRepository(CuttingRecord)
    private cuttingRepo: Repository<CuttingRecord>,

    @InjectRepository(BalokEntity)
    private balokRepo: Repository<BalokEntity>,

    @InjectRepository(ActualEntity)
    private actualRepo: Repository<ActualEntity>,

    @InjectRepository(ProductionCuttingRecord)
    private productionCuttingRepo: Repository<ProductionCuttingRecord>,

    @InjectRepository(ProductionCuttingEntry)
    private productionCuttingEntryRepo: Repository<ProductionCuttingEntry>,
  ) {}

  // ===== CUTTING RECORD METHODS =====

  async create(dto: CreateCuttingDto) {
    if (!dto.productionDate)
      throw new BadRequestException('productionDate wajib diisi');
    if (!dto.shift) throw new BadRequestException('shift wajib diisi');
    if (!dto.machine) throw new BadRequestException('machine wajib diisi');
    if (!dto.operator) throw new BadRequestException('operator wajib diisi');
    if (!dto.time) throw new BadRequestException('time wajib diisi');
    if (dto.noUrut === undefined)
      throw new BadRequestException('noUrut wajib diisi');

    const record = this.cuttingRepo.create({
      productionDate: dto.productionDate,
      shift: dto.shift,
      machine: dto.machine,
      operator: dto.operator,
      time: dto.time,
      noUrut: dto.noUrut,
      week: dto.week || '',
      foamingDate: dto.foamingDate,
      balok: [],
      actuals: [],
    });

    try {
      const savedRecord = await this.cuttingRepo.save(record);

      if (dto.balok && dto.balok.length > 0) {
        for (const balokData of dto.balok) {
          const balokEntity = this.balokRepo.create({
            density: balokData.density || null,
            ild: balokData.ild || null,
            colour: balokData.colour,
            length: parseNumber(balokData.length),
            width: parseNumber(balokData.width),
            height: parseNumber(balokData.height),
            sizeActual: balokData.sizeActual ?? null,
            qtyBalok: parseNumber(balokData.qtyBalok),
            cuttingRecord: savedRecord,
          });
          await this.balokRepo.save(balokEntity);
        }
      }

      if (dto.actual && Array.isArray(dto.actual) && dto.actual.length > 0) {
        const actualEntities = dto.actual.map((a) =>
          this.actualRepo.create({
            density: a.density || null,
            ild: a.ild || null,
            colour: a.colour,
            length: parseNumber(a.length),
            width: parseNumber(a.width),
            height: parseNumber(a.height),
            qtyBalok: parseNumber(a.qtyBalok),
            qtyProduksi: parseNumber(a.qtyProduksi),
            reSize: a.reSize ?? null,
            jdfWeight: parseNumber(a.jdfWeight),
            remark: a.remark ?? null,
            descript: a.descript,
            cuttingRecord: savedRecord,
          }),
        );
        await this.actualRepo.save(actualEntities);
      }

      return await this.findOne(savedRecord.id);
    } catch (error) {
      console.error('❌ Error saat create:', error.message);
      throw error;
    }
  }

  async findAll() {
    return await this.cuttingRepo.find({
      relations: ['balok', 'actuals'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const record = await this.cuttingRepo.findOne({
      where: { id },
      relations: ['balok', 'actuals'],
    });

    if (!record) {
      throw new NotFoundException(
        `Cutting record dengan ID "${id}" tidak ditemukan`,
      );
    }

    return record;
  }

  async update(id: string, dto: UpdateCuttingDto) {
    const record = await this.findOne(id);

    Object.assign(record, {
      productionDate: dto.productionDate ?? record.productionDate,
      shift: dto.shift ?? record.shift,
      machine: dto.machine ?? record.machine,
      operator: dto.operator ?? record.operator,
      time: dto.time ?? record.time,
      noUrut: dto.noUrut ?? record.noUrut,
      week: dto.week ?? record.week,
      foamingDate: dto.foamingDate ?? record.foamingDate,
    });

    await this.cuttingRepo.save(record);

    if (dto.balok !== undefined) {
      await this.balokRepo.delete({ cuttingRecord: { id } });
      if (dto.balok) {
        const balokEntity = this.balokRepo.create({
          density: dto.balok.density || null,
          ild: dto.balok.ild || null,
          colour: dto.balok.colour,
          length: parseNumber(dto.balok.length),
          width: parseNumber(dto.balok.width),
          height: parseNumber(dto.balok.height),
          sizeActual: dto.balok.sizeActual ?? null,
          qtyBalok: parseNumber(dto.balok.qtyBalok),
          cuttingRecord: record,
        });
        await this.balokRepo.save(balokEntity);
      }
    }

    if (dto.actual !== undefined) {
      await this.actualRepo.delete({ cuttingRecord: { id } });
      if (Array.isArray(dto.actual) && dto.actual.length > 0) {
        const actualEntities = dto.actual.map((a) =>
          this.actualRepo.create({
            density: a.density || null,
            ild: a.ild || null,
            colour: a.colour,
            length: parseNumber(a.length),
            width: parseNumber(a.width),
            height: parseNumber(a.height),
            qtyBalok: parseNumber(a.qtyBalok),
            qtyProduksi: parseNumber(a.qtyProduksi),
            reSize: a.reSize ?? null,
            jdfWeight: parseNumber(a.jdfWeight),
            remark: a.remark ?? null,
            descript: a.descript,
            cuttingRecord: record,
          }),
        );
        await this.actualRepo.save(actualEntities);
      }
    }

    return await this.findOne(id);
  }

  async remove(id: string) {
    const result = await this.cuttingRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `Cutting record dengan ID "${id}" tidak ditemukan`,
      );
    }
    return { message: `Cutting record dengan ID "${id}" berhasil dihapus`, id };
  }

  // ===== PRODUCTION CUTTING METHODS =====

  async createProductionCutting(dto: CreateProductionCuttingDto) {
    if (!dto.timestamp) throw new BadRequestException('timestamp wajib diisi');
    if (!dto.shift) throw new BadRequestException('shift wajib diisi');
    if (!dto.group) throw new BadRequestException('group wajib diisi');
    if (!dto.time) throw new BadRequestException('time wajib diisi');
    if (!dto.entries || dto.entries.length === 0) {
      throw new BadRequestException('entries wajib diisi minimal 1 item');
    }

    const record = this.productionCuttingRepo.create({
      timestamp: dto.timestamp,
      shift: dto.shift,
      group: dto.group,
      time: dto.time,
      machine: dto.machine || null,
      operator: dto.operator || null,
      entries: [],
    });

    try {
      const savedRecord = await this.productionCuttingRepo.save(record);

      const entryEntities = dto.entries.map((entry) => {
        const quantityProduksi = parseNumber(entry.quantityProduksi) || 0;
        return this.productionCuttingEntryRepo.create({
          customer: entry.customer,
          poNumber: entry.poNumber,
          sku: entry.sku,
          sCode: entry.sCode || null,
          description: entry.description || null,
          quantityOrder: parseNumber(entry.quantityOrder) || 0,
          quantityProduksi: quantityProduksi,
          week: entry.week || null,
          isHole: entry.isHole || false,
          foamingDate: entry.foamingDate || null,
          foamingDateCompleted: !!entry.foamingDate ? false : false,
          quantityHole: 0,
          quantityHoleRemain: quantityProduksi,
          productionCuttingRecord: savedRecord,
        });
      });

      await this.productionCuttingEntryRepo.save(entryEntities);

      return await this.findOneProductionCutting(savedRecord.id);
    } catch (error) {
      console.error('❌ Error saat create production cutting:', error.message);
      throw error;
    }
  }

  async findAllProductionCutting() {
    const records = await this.productionCuttingRepo.find({
      relations: ['entries'],
      order: { createdAt: 'DESC' },
    });

    return await this.computeRemainQuantities(records);
  }

  async findOneProductionCutting(id: string) {
    const record = await this.productionCuttingRepo.findOne({
      where: { id },
      relations: ['entries'],
    });

    if (!record) {
      throw new NotFoundException(
        `Production cutting record dengan ID "${id}" tidak ditemukan`,
      );
    }

    const [recordWithRemain] = await this.computeRemainQuantities([record]);
    return recordWithRemain;
  }

  private async computeRemainQuantities(records: ProductionCuttingRecord[]) {
    const keys = new Set<string>();
    records.forEach((record) => {
      record.entries?.forEach((entry) => {
        if (entry.poNumber && entry.sku && entry.sCode) {
          keys.add(`${entry.poNumber}|${entry.sku}|${entry.sCode}`);
        }
      });
    });

    const totalProducedMap = new Map<string, number>();

    for (const key of keys) {
      const [poNumber, sku, sCode] = key.split('|');

      const result = await this.productionCuttingEntryRepo
        .createQueryBuilder('entry')
        .select('SUM(entry.quantityProduksi)', 'total')
        .where('entry.po_number = :poNumber', { poNumber })
        .andWhere('entry.sku = :sku', { sku })
        .andWhere('entry.s_code = :sCode', { sCode })
        .getRawOne();

      totalProducedMap.set(key, parseFloat(result?.total || 0));
    }

    return records.map((record) => ({
      ...record,
      entries: record.entries?.map((entry) => {
        const key = `${entry.poNumber}|${entry.sku}|${entry.sCode}`;
        const totalProduced = totalProducedMap.get(key) || 0;
        const remain = entry.quantityOrder - totalProduced;

        return {
          ...entry,
          remainQuantity: remain,
        };
      }),
    }));
  }

  async updateHoleQuantity(entryId: string, quantityHole: number) {
    const entry = await this.productionCuttingEntryRepo.findOne({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException(
        `Entry dengan ID "${entryId}" tidak ditemukan`,
      );
    }

    const newQuantityHole = entry.quantityHole + quantityHole;
    if (newQuantityHole > entry.quantityProduksi) {
      throw new BadRequestException('Quantity hole exceeds quantity produksi');
    }

    entry.quantityHole = newQuantityHole;
    entry.quantityHoleRemain = entry.quantityProduksi - entry.quantityHole;

    return await this.productionCuttingEntryRepo.save(entry);
  }

  async markFoamingDateCompleted(entryId: string) {
    const entry = await this.productionCuttingEntryRepo.findOne({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException(
        `Entry dengan ID "${entryId}" tidak ditemukan`,
      );
    }

    if (!entry.foamingDate) {
      throw new BadRequestException('Entry tidak memiliki foaming date');
    }

    entry.foamingDateCompleted = true;
    return await this.productionCuttingEntryRepo.save(entry);
  }

  @Cron('*/10 * * * *')
  async autoCompleteFoamingDates() {
    const now = new Date();
    console.log(
      `[Cron] Memeriksa foaming date yang sudah lewat... (${now.toISOString()})`,
    );

    try {
      const result = await this.productionCuttingEntryRepo
        .createQueryBuilder()
        .update(ProductionCuttingEntry)
        .set({ foamingDateCompleted: true })
        .where('foaming_date IS NOT NULL')
        .andWhere('foaming_date <= :now', { now })
        .andWhere('foaming_date_completed = false')
        .execute();

      if (result.affected && result.affected > 0) {
        console.log(
          `✅ ${result.affected} entry foaming date otomatis ditandai selesai.`,
        );
      }
    } catch (error) {
      console.error('❌ Gagal menjalankan auto-complete foaming date:', error);
    }
  }

  async removeProductionCutting(id: string) {
    const result = await this.productionCuttingRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `Production cutting record dengan ID "${id}" tidak ditemukan`,
      );
    }
    return {
      message: `Production cutting record dengan ID "${id}" berhasil dihapus`,
      id,
    };
  }
}