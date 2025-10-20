// src/entities/product.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn({ name: 'product_id' })
  productId: number;

  @Column({ name: 'item_number', type: 'varchar', length: 100 })
  itemNumber: string;

  @Column({ name: 'sku', type: 'varchar', length: 100, unique: true })
  sku: string;

  @Column({ type: 'varchar', length: 50 })
  category: string; // 'FOAM' | 'SPRING'

  @Column({ name: 'spec_length', type: 'real' })
  specLength: number;

  @Column({ name: 'spec_width', type: 'real' })
  specWidth: number;

  @Column({ name: 'spec_height', type: 'real' })
  specHeight: number;

  @Column({ name: 'spec_unit', type: 'varchar', length: 20 })
  specUnit: string;

  @Column({ name: 'item_description', type: 'text' })
  itemDescription: string;
}