import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuttingProcess } from './entities/cutting-process.entity';
import { CuttingReplacementService } from './cutting-replacement.service';
import { CuttingReplacementController } from './cutting-replacement.controller';
import { ReplacementModule } from '../replacement/replacement.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CuttingProcess]),
    ReplacementModule,
  ],
  controllers: [CuttingReplacementController],
  providers: [CuttingReplacementService],
  exports: [CuttingReplacementService],
})
export class CuttingReplacementModule {}
