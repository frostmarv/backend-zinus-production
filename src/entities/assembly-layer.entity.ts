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
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id: number;

  @Column({ name: 'productProductId' })
  productProductId: number;

  @ManyToOne(() => Product, (product) => product.productId, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'productProductId', referencedColumnName: 'productId' })
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

  // 🔴 Perbaikan: Ganti type: 'timestamp' menjadi type: 'datetime'
  @Column({
    name: 'created_at',
    type: 'datetime', // ✅ Bukan 'timestamp'
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
