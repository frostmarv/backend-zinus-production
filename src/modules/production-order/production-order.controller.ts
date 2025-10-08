// src/modules/production-order/production-order.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  Patch,
  Delete,
} from '@nestjs/common';
import { ProductionOrderService } from './production-order.service';
import { ProductionOrder } from '../../entities/production-order.entity';

@Controller('production-orders')
export class ProductionOrderController {
  constructor(private readonly orderService: ProductionOrderService) {}

  @Get()
  findAll(): Promise<ProductionOrder[]> {
    return this.orderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductionOrder> {
    return this.orderService.findOne(id);
  }

  @Post()
  create(
    @Body()
    body: {
      customer_id: number;
      customer_po: string;
      po_number: string;
      order_date?: Date;
      status?: string;
    },
  ): Promise<ProductionOrder> {
    return this.orderService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<ProductionOrder>,
  ): Promise<ProductionOrder> {
    return this.orderService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.orderService.remove(id);
  }
}
