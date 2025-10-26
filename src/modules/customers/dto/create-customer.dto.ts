import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  customerName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  customerCode: string;
}