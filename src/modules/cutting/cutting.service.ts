// src/modules/cutting/cutting.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CuttingRecord } from './cutting.entity';
import { BalokEntity } from './balok.entity';
import { ActualEntity } from './actual.entity';
import { CreateCuttingDto } from './dto/create-cutting.dto';
import { UpdateCuttingDto } from './dto/update-cutting.dto';

// Helper: konversi ke number, return null jika invalid
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
  ) {}

  async create(dto: CreateCuttingDto) {
    // ✅ Validasi input wajib
    if (!dto.productionDate) throw new Error('productionDate wajib diisi');
    if (!dto.shift) throw new Error('shift wajib diisi');
    if (!dto.machine) throw new Error('machine wajib diisi');
    if (!dto.operator) throw new Error('operator wajib diisi');
    if (!dto.time) throw new Error('time wajib diisi');
    if (dto.noUrut === undefined) throw new Error('noUrut wajib diisi');

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

      // ✅ Simpan balok
      if (dto.balok) {
        const balokEntity = this.balokRepo.create({
          density: dto.balok.density ?? null,
          ild: dto.balok.ild ?? null,
          colour: dto.balok.colour,
          length: parseNumber(dto.balok.length),
          width: parseNumber(dto.balok.width),
          height: parseNumber(dto.balok.height),
          sizeActual: dto.balok.sizeActual ?? null,
          qtyBalok: parseNumber(dto.balok.qtyBalok),
          cuttingRecord: savedRecord,
        });
        await this.balokRepo.save(balokEntity);
      }

      // ✅ Simpan semua actual
      if (dto.actual && Array.isArray(dto.actual) && dto.actual.length > 0) {
        const actualEntities = dto.actual.map((a) =>
          this.actualRepo.create({
            density: a.density ?? null,
            ild: a.ild ?? null,
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

    // ✅ Update header
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

    // ✅ Update balok
    if (dto.balok !== undefined) {
      await this.balokRepo.delete({ cuttingRecord: { id } });
      if (dto.balok) {
        const balokEntity = this.balokRepo.create({
          density: dto.balok.density ?? null,
          ild: dto.balok.ild ?? null,
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

    // ✅ Update actual
    if (dto.actual !== undefined) {
      await this.actualRepo.delete({ cuttingRecord: { id } });
      if (Array.isArray(dto.actual) && dto.actual.length > 0) {
        const actualEntities = dto.actual.map((a) =>
          this.actualRepo.create({
            density: a.density ?? null,
            ild: a.ild ?? null,
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
}
