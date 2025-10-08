import { PartialType } from '@nestjs/mapped-types';
import { CreateProductionPlanningDto } from './create-production-planning.dto';

export class UpdateProductionPlanningDto extends PartialType(
  CreateProductionPlanningDto,
) {}
