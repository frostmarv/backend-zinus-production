// src/entities/assembly-layer.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('assembly_layers')
export class AssemblyLayer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_product_id' })
  productProductId: number;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_product_id', referencedColumnName: 'productId' })
  product: Product;

  @Column({ name: 'second_item_number' })
  secondItemNumber: string;

  @Column({ name: 'description' })
  description: string;

  @Column({ name: 'description_line_2', nullable: true })
  descriptionLine2: string | null;

  @Column({ name: 'layer_index', nullable: true })
  layerIndex: number | null;

  @Column({ name: 'category_layers', nullable: true })
  categoryLayers: string | null;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}