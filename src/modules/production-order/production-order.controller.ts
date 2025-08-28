import { Controller, Get, Post, Body } from '@nestjs/common';
import { ProductionOrderService } from './production-order.service';
import { CreateProductionOrderDto } from './dto/create-production-order.dto';

@Controller('api/orders')
export class ProductionOrderController {
  constructor(private service: ProductionOrderService) {}

  @Post()
  create(@Body() dto: CreateProductionOrderDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}