import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssemblyLayer } from '../../entities/assembly-layer.entity';
import { Product } from '../../entities/product.entity';
import { AssemblyLayersController } from './assembly-layers.controller';
import { AssemblyLayersService } from './assembly-layers.service';

@Module({
  imports: [TypeOrmModule.forFeature([AssemblyLayer, Product])],
  controllers: [AssemblyLayersController],
  providers: [AssemblyLayersService],
  exports: [AssemblyLayersService],
})
export class AssemblyLayersModule {}
