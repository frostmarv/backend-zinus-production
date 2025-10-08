import { Module } from '@nestjs/common';
import { WorkableBondingController } from './workable-bonding.controller';
import { WorkableBondingService } from './workable-bonding.service';

@Module({
  controllers: [WorkableBondingController],
  providers: [WorkableBondingService],
  exports: [WorkableBondingService],
})
export class WorkableBondingModule {}
