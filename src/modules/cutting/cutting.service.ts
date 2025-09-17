// src/modules/cutting/cutting.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CuttingRecord } from './cutting.entity';
import { BalokEntity } from './balok.entity'; // ✅ Import entity anak
import { CreateCuttingDto } from './dto/create-cutting.dto';

@Injectable()
export class CuttingService {
  constructor(
    @InjectRepository(CuttingRecord)
    private cuttingRepo: Repository<CuttingRecord>,

    @InjectRepository(BalokEntity)
    private balokRepo: Repository<BalokEntity>, // ✅ Untuk create balok
  ) {}

  async create(dto: CreateCuttingDto) {
    // Buat record utama
    const record = this.cuttingRepo.create({
      ...dto.header,
      foamingDate: dto.foamingDate,
      balok: [], // kosong dulu
    });

    // Simpan dulu agar dapat ID
    const savedRecord = await this.cuttingRepo.save(record);

    // Buat dan simpan balok satu per satu
    const balokEntities = dto.balok.map((b) => {
      return this.balokRepo.create({
        density: b.density || null,
        ild: b.ild || null,
        colour: b.colour,
        length: b.length ? Number(b.length) : null,
        width: b.width ? Number(b.width) : null,
        height: b.height ? Number(b.height) : null,
        sizeActual: b.sizeActual || null,
        qtyBalok: b.qtyBalok ? Number(b.qtyBalok) : null,
        cuttingRecord: savedRecord, // ⚠️ relasi wajib
      });
    });

    // Simpan semua balok
    await this.balokRepo.save(balokEntities);

    // Reload record dengan relasi
    return await this.cuttingRepo.findOne({
      where: { id: savedRecord.id },
      relations: ['balok'],
    });
  }

  async findAll() {
    return await this.cuttingRepo.find({
      relations: ['balok'],
      order: { createdAt: 'DESC' },
    });
  }
}
