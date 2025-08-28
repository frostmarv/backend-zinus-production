import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class ProductionOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productCode: string;

  @Column()
  productName: string;

  @Column('int')
  quantity: number;

  @Column({ default: 'raw-material' })
  stage: 'raw-material' | 'cutting' | 'sewing' | 'qc' | 'packing' | 'shipped';

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}