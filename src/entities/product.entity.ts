import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { AssemblyLayer } from './assembly-layer.entity';

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

  @Column({ name: 'spec', type: 'varchar', length: 200 }) // ✅ satu kolom
  spec: string; // contoh: "75*54*8IN"

  @Column({ name: 'item_description', type: 'text' })
  itemDescription: string;

  // 🔹 Relasi balik ke AssemblyLayer
  @OneToMany(() => AssemblyLayer, (layer) => layer.product, {
    cascade: true,
  })
  assemblyLayers?: AssemblyLayer[];
}