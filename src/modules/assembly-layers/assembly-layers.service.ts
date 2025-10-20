// src/modules/assembly-layers/assembly-layers.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssemblyLayer } from '../../entities/assembly-layer.entity';
import { Product } from '../../entities/product.entity';
import { CreateAssemblyLayerDto } from './dto/create-assembly-layer.dto';
import { UpdateAssemblyLayerDto } from './dto/update-assembly-layer.dto';
import { UploadAssemblyLayersDto } from './dto/upload-assembly-layer.dto';

@Injectable()
export class AssemblyLayersService {
  constructor(
    @InjectRepository(AssemblyLayer)
    private assemblyLayerRepo: Repository<AssemblyLayer>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async findAll() {
    return this.assemblyLayerRepo
      .createQueryBuilder('al')
      .leftJoinAndSelect('al.product', 'p')
      .select([
        'al.id',
        'al.secondItemNumber',
        'al.description',
        'al.descriptionLine2',
        'al.layerIndex',
        'al.createdAt',
        'p.productId',
        'p.itemNumber',
        'p.sku',
      ])
      .orderBy('p.sku', 'ASC')
      .addOrderBy('al.layerIndex', 'ASC')
      .getMany();
  }

  async findOne(id: number) {
    const layer = await this.assemblyLayerRepo
      .createQueryBuilder('al')
      .leftJoinAndSelect('al.product', 'p')
      .where('al.id = :id', { id })
      .select([
        'al.id',
        'al.secondItemNumber',
        'al.description',
        'al.descriptionLine2',
        'al.layerIndex',
        'al.createdAt',
        'p.productId',
        'p.itemNumber',
        'p.sku',
      ])
      .getOne();

    if (!layer) {
      throw new NotFoundException(`Assembly layer with ID ${id} not found`);
    }

    return layer;
  }

  async create(dto: CreateAssemblyLayerDto) {
    const product = await this.productRepo.findOne({
      where: { sku: dto.product_sku },
    });

    if (!product) {
      throw new BadRequestException(
        `Product dengan SKU ${dto.product_sku} tidak ditemukan`,
      );
    }

    const existing = await this.assemblyLayerRepo.findOne({
      where: {
        product: { productId: product.productId },
        secondItemNumber: dto.second_item_number,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Assembly layer dengan second_item_number '${dto.second_item_number}' sudah ada untuk produk ini`,
      );
    }

    const layer = this.assemblyLayerRepo.create({
      product,
      secondItemNumber: dto.second_item_number,
      description: dto.description,
      descriptionLine2: dto.description_line_2 ?? null,
      layerIndex: dto.layer_index ?? null,
      categoryLayers: dto.category_layers ?? null,
    });

    const saved = await this.assemblyLayerRepo.save(layer);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateAssemblyLayerDto) {
    const layer = await this.assemblyLayerRepo.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!layer) {
      throw new NotFoundException(`Assembly layer with ID ${id} not found`);
    }

    let targetProduct = layer.product;
    let targetSecondItemNumber = layer.secondItemNumber;

    if (dto.product_sku !== undefined) {
      const product = await this.productRepo.findOne({
        where: { sku: dto.product_sku },
      });

      if (!product) {
        throw new BadRequestException(
          `Product dengan SKU ${dto.product_sku} tidak ditemukan`,
        );
      }
      targetProduct = product;
    }

    if (dto.second_item_number !== undefined) {
      targetSecondItemNumber = dto.second_item_number;
    }

    // Cek duplikasi hanya jika ada perubahan pada product atau second_item_number
    if (
      dto.product_sku !== undefined ||
      dto.second_item_number !== undefined
    ) {
      // ✅ Gunakan QueryBuilder untuk kondisi kompleks (termasuk id != :id)
      const existing = await this.assemblyLayerRepo
        .createQueryBuilder('al')
        .where('al.productProductId = :productId', {
          productId: targetProduct.productId,
        })
        .andWhere('al.secondItemNumber = :secondItemNumber', {
          secondItemNumber: targetSecondItemNumber,
        })
        .andWhere('al.id != :id', { id })
        .getOne();

      if (existing) {
        throw new BadRequestException(
          `Assembly layer dengan second_item_number '${targetSecondItemNumber}' sudah ada untuk produk ini`,
        );
      }
    }

    // Update fields
    if (dto.second_item_number !== undefined) {
      layer.secondItemNumber = dto.second_item_number;
    }
    if (dto.description !== undefined) {
      layer.description = dto.description;
    }
    if (dto.description_line_2 !== undefined) {
      layer.descriptionLine2 = dto.description_line_2;
    }
    if (dto.layer_index !== undefined) {
      layer.layerIndex = dto.layer_index;
    }
    if (dto.category_layers !== undefined) {
      layer.categoryLayers = dto.category_layers;
    }
    if (dto.product_sku !== undefined) {
      layer.product = targetProduct;
    }

    await this.assemblyLayerRepo.save(layer);
    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.assemblyLayerRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Assembly layer with ID ${id} not found`);
    }
    return { message: `Assembly layer with ID ${id} has been deleted` };
  }

  async upload(dto: UploadAssemblyLayersDto) {
    const results = [];
    const errors = [];

    for (const [index, layerDto] of dto.layers.entries()) {
      try {
        const layer = await this.create(layerDto);
        results.push(layer);
      } catch (error) {
        errors.push({
          index: index + 1,
          sku: layerDto.product_sku,
          second_item_number: layerDto.second_item_number,
          error: error.message || 'Gagal menyimpan layer',
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