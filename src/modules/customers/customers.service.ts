// src/modules/customers/customers.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  findAll(): Promise<Customer[]> {
    return this.customerRepo.find();
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.customerRepo.findOne({
      where: { customerId: id }, // 👈 gunakan property name, bukan nama kolom
    });
    if (!customer)
      throw new NotFoundException(`Customer dengan ID "${id}" tidak ditemukan`);
    return customer;
  }

  // 🔹 BARU: Cari berdasarkan kode
  async findByCode(customerCode: string): Promise<Customer | null> {
    return this.customerRepo.findOne({ where: { customerCode } });
  }

  // 🔹 BARU: Cari berdasarkan nama
  async findByName(customerName: string): Promise<Customer | null> {
    return this.customerRepo.findOne({ where: { customerName } });
  }

  // 🔹 BARU: Buat customer baru
  async create(customerName: string, customerCode: string): Promise<Customer> {
    const existing = await this.findByCode(customerCode);
    if (existing) {
      throw new BadRequestException(
        `Customer dengan kode "${customerCode}" sudah ada`,
      );
    }
    const customer = this.customerRepo.create({ customerName, customerCode });
    return this.customerRepo.save(customer);
  }
}
