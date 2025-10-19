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
import { UploadAssemblyLayersDto } from './dto/upload-assembly-layer.dto'; // 🔴 Perbaikan: path file

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
      .leftJoin('products', 'p', 'p.product_id = al.productProductId')
      .select([
        'al.id as id',
        'al.second_item_number as second_item_number',
        'al.description as description',
        'al.description_line_2 as description_line_2',
        'al.layer_index as layer_index',
        'al.created_at as created_at',
        'p.product_id as product_id',
        'p.item_number as item_number',
        'p.sku as sku',
      ])
      .orderBy('p.sku', 'ASC')
      .addOrderBy('al.layer_index', 'ASC')
      .getRawMany();
  }

  async findOne(id: number) {
    const layer = await this.assemblyLayerRepo
      .createQueryBuilder('al')
      .leftJoin('products', 'p', 'p.product_id = al.productProductId')
      .where('al.id = :id', { id })
      .select([
        'al.id as id',
        'al.second_item_number as second_item_number',
        'al.description as description',
        'al.description_line_2 as description_line_2',
        'al.layer_index as layer_index',
        'al.created_at as created_at',
        'p.product_id as product_id',
        'p.item_number as item_number',
        'p.sku as sku',
      ])
      .getRawOne();

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
      descriptionLine2: dto.description_line_2 || null,
      layerIndex: dto.layer_index || null,
      categoryLayers: dto.category_layers || null,
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

    let targetProductId = layer.product.productId;
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

      layer.product = product;
      targetProductId = product.productId;
    }

    if (dto.second_item_number !== undefined) {
      targetSecondItemNumber = dto.second_item_number;
    }

    if (dto.product_sku !== undefined || dto.second_item_number !== undefined) {
      const existing = await this.assemblyLayerRepo
        .createQueryBuilder('al')
        .where('al.productProductId = :productId', {
          productId: targetProductId,
        })
        .andWhere('al.second_item_number = :secondItemNumber', {
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

    await this.assemblyLayerRepo.save(layer);
    return this.findOne(id);
  }

  async remove(id: number) {
    const layer = await this.assemblyLayerRepo.findOne({ where: { id } });

    if (!layer) {
      throw new NotFoundException(`Assembly layer with ID ${id} not found`);
    }

    await this.assemblyLayerRepo.remove(layer);
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
