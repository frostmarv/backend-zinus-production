// src/modules/production-order-item/production-order-item.controller.ts
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ProductionOrderItemService } from './production-order-item.service';

@Controller('production-order-items')
export class ProductionOrderItemController {
  constructor(private readonly poiService: ProductionOrderItemService) {}

  @Get()
  findAll() {
    return this.poiService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.poiService.findOne(id);
  }
}
