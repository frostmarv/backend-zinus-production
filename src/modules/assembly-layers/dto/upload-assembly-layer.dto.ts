// src/modules/assembly-layers/dto/upload-assembly-layers.dto.ts
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CreateAssemblyLayerDto } from './create-assembly-layer.dto';

export class UploadAssemblyLayersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAssemblyLayerDto)
  layers: CreateAssemblyLayerDto[];
}
