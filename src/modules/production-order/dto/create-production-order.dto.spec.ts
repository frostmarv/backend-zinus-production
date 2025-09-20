import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateProductionOrderDto } from './create-production-order.dto';

describe('CreateProductionOrderDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = plainToClass(CreateProductionOrderDto, {
      productCode: 'PROD-001',
      productName: 'Test Product',
      quantity: 10,
      notes: 'Optional notes',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation when productCode is empty', async () => {
    const dto = plainToClass(CreateProductionOrderDto, {
      productCode: '',
      productName: 'Test Product',
      quantity: 10,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('productCode');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation when productName is empty', async () => {
    const dto = plainToClass(CreateProductionOrderDto, {
      productCode: 'PROD-001',
      productName: '',
      quantity: 10,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('productName');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation when quantity is less than 1', async () => {
    const dto = plainToClass(CreateProductionOrderDto, {
      productCode: 'PROD-001',
      productName: 'Test Product',
      quantity: 0,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('quantity');
    expect(errors[0].constraints).toHaveProperty('min');
  });

  it('should fail validation when quantity is not a number', async () => {
    const dto = plainToClass(CreateProductionOrderDto, {
      productCode: 'PROD-001',
      productName: 'Test Product',
      quantity: 'invalid',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('quantity');
    expect(errors[0].constraints).toHaveProperty('isNumber');
  });

  it('should pass validation when notes is optional', async () => {
    const dto = plainToClass(CreateProductionOrderDto, {
      productCode: 'PROD-001',
      productName: 'Test Product',
      quantity: 10,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});