//src/entities/product.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  product_id: number;

  @Column({ unique: true })
  item_number: string;

  @Column({ unique: true })
  sku: string;

  @Column()
  category: string;

  @Column({ nullable: true })
  spec_length: number;

  @Column({ nullable: true })
  spec_width: number;

  @Column({ nullable: true })
  spec_height: number;

  @Column({ default: 'IN' })
  spec_unit: string;

  @Column({ nullable: true })
  density: number;

  @Column({ nullable: true })
  coil_gauge: number;

  @Column()
  item_description: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;
}
