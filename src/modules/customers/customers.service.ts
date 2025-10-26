import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UploadCustomersDto } from './dto/upload-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  findAll(): Promise<Customer[]> {
    return this.customerRepo.find();
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.customerRepo.findOne({
      where: { customerId: id },
    });
    if (!customer) {
      throw new NotFoundException(`Customer dengan ID "${id}" tidak ditemukan`);
    }
    return customer;
  }

  async findByCode(customerCode: string): Promise<Customer | null> {
    return this.customerRepo.findOne({ where: { customerCode } });
  }

  async findByName(customerName: string): Promise<Customer | null> {
    return this.customerRepo.findOne({ where: { customerName } });
  }

  async create(createDto: CreateCustomerDto): Promise<Customer> {
    const existing = await this.findByCode(createDto.customerCode);
    if (existing) {
      throw new BadRequestException(
        `Customer dengan kode "${createDto.customerCode}" sudah ada`,
      );
    }
    const customer = this.customerRepo.create(createDto);
    return this.customerRepo.save(customer);
  }

  async update(id: number, updateDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);

    // Cek duplikasi customerCode jika diubah
    if (updateDto.customerCode && updateDto.customerCode !== customer.customerCode) {
      const existing = await this.findByCode(updateDto.customerCode);
      if (existing) {
        throw new BadRequestException(
          `Kode customer "${updateDto.customerCode}" sudah digunakan`,
        );
      }
    }

    Object.assign(customer, updateDto);
    return this.customerRepo.save(customer);
  }

  async remove(id: number): Promise<void> {
    const result = await this.customerRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Customer dengan ID "${id}" tidak ditemukan`);
    }
  }

  // 🔹 Upload massal (JSON)
  async upload(dto: UploadCustomersDto) {
    const results = [];
    const errors = [];

    for (const [index, customerDto] of dto.customers.entries()) {
      try {
        const customer = await this.create(customerDto);
        results.push(customer);
      } catch (error) {
        errors.push({
          index: index + 1,
          customerCode: customerDto.customerCode,
          error: error.message || 'Gagal menyimpan customer',
        });
      }
    }

    return {
      success: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }
}