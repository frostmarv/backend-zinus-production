import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('assembly_layers')
@Unique(['product', 'secondItemNumber'])
@Index(['product'])
@Index(['product', 'layerIndex'])
export class AssemblyLayer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'productProductId' })
  product: Product;

  @Column({ name: 'second_item_number', type: 'varchar', length: 100 })
  secondItemNumber: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'description_line_2', type: 'varchar', length: 200, nullable: true })
  descriptionLine2: string;

  @Column({ name: 'layer_index', type: 'int', nullable: true })
  layerIndex: number;

  @Column({ name: 'category_layers', type: 'varchar', length: 50, nullable: true })
  categoryLayers: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
