// src/packing-foam/dto/update-packing-foam-summary.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreatePackingFoamSummaryDto } from './create-packing-foam-summary.dto';

export class UpdatePackingFoamSummaryDto extends PartialType(CreatePackingFoamSummaryDto) {}