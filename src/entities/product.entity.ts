// src/entities/product.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('increment', { name: 'product_id' })
  productId: number;

  @Column({ name: 'item_number' })
  itemNumber: string;

  @Column({ unique: true })
  sku: string;

  @Column()
  category: string; // 'FOAM' | 'SPRING'

  @Column({ name: 'spec_length', type: 'real' })
  specLength: number;

  @Column({ name: 'spec_width', type: 'real' })
  specWidth: number;

  @Column({ name: 'spec_height', type: 'real' })
  specHeight: number;

  @Column({ name: 'spec_unit' })
  specUnit: string;

  @Column({ name: 'item_description' })
  itemDescription: string;
}
