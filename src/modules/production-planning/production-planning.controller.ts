import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductionPlanningService } from './production-planning.service';
import {
  CreateProductionPlanningDto,
  UpdateProductionPlanningDto,
} from './dto';

@Controller('production-planning')
export class ProductionPlanningController {
  constructor(private readonly planningService: ProductionPlanningService) {}

  @Get('foam')
  async getFoamPlanning() {
    return this.planningService.findAllFoam();
  }

  @Get('spring')
  async getSpringPlanning() {
    return this.planningService.findAllSpring();
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.planningService.findOneById(id);
  }

  @Post()
  async create(@Body() dto: CreateProductionPlanningDto) {
    return this.planningService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductionPlanningDto,
  ) {
    return this.planningService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.planningService.delete(id);
  }
}