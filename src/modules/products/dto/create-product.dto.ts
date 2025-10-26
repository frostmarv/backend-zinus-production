import { IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  itemNumber: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(FOAM|SPRING)$/i, {
    message: 'Category harus "FOAM" atau "SPRING"',
  })
  category: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  spec: string; // contoh: "75*54*8IN"

  @IsString()
  @IsNotEmpty()
  itemDescription: string;
}