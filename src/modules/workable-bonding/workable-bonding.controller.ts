// src/modules/workable-bonding/workable-bonding.controller.ts
import { Controller, Get } from '@nestjs/common';
import { WorkableBondingService } from './workable-bonding.service';

@Controller('workable-bonding')
export class WorkableBondingController {
  constructor(
    private readonly workableBondingService: WorkableBondingService,
  ) {}

  @Get()
  async getWorkableBonding() {
    return this.workableBondingService.getWorkableBonding();
  }

  @Get('detail')
  async getWorkableDetail() {
    return this.workableBondingService.getWorkableDetail();
  }

  @Get('reject')
  async getWorkableReject() {
    return this.workableBondingService.getWorkableReject();
  }
}
