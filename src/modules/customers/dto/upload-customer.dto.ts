import { Type } from 'class-transformer';
import { ValidateNested, IsArray } from 'class-validator';
import { CreateCustomerDto } from './create-customer.dto';

export class UploadCustomersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerDto)
  customers: CreateCustomerDto[];
}