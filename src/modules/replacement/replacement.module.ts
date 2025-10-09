import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReplacementProgress } from './entities/replacement-progress.entity';
import { ReplacementService } from './replacement.service';
import { ReplacementController } from './replacement.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ReplacementProgress])],
  controllers: [ReplacementController],
  providers: [ReplacementService],
  exports: [ReplacementService],
})
export class ReplacementModule {}
