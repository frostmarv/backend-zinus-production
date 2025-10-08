import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { MasterDataService } from './master-data.service';

@Controller('master-data')
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  // 1. GET /api/master-data/customers
  @Get('customers')
  async getCustomers() {
    return this.masterDataService.getCustomers();
  }

  // 2. GET /api/master-data/po-numbers?customerId=1
  @Get('po-numbers')
  async getPoNumbers(@Query('customerId') customerId: string) {
    return this.masterDataService.getPoNumbers(Number(customerId));
  }

  // 3. GET /api/master-data/customer-pos?poNumber=PO12345
  @Get('customer-pos')
  async getCustomerPos(@Query('poNumber') poNumber: string) {
    return this.masterDataService.getCustomerPos(poNumber);
  }

  // 4. GET /api/master-data/skus?customerPo=XYZ
  @Get('skus')
  async getSkus(@Query('customerPo') customerPo: string) {
    return this.masterDataService.getSkus(customerPo);
  }

  // 5. GET /api/master-data/qty-plans?customerPo=XYZ&sku=SKU123
  @Get('qty-plans')
  async getQtyPlans(
    @Query('customerPo') customerPo: string,
    @Query('sku') sku: string,
  ) {
    return this.masterDataService.getQtyPlans(customerPo, sku);
  }

  // 6. GET /api/master-data/weeks?customerPo=XYZ&sku=SKU123
  @Get('weeks')
  async getWeeks(
    @Query('customerPo') customerPo: string,
    @Query('sku') sku: string,
  ) {
    return this.masterDataService.getWeeks(customerPo, sku);
  }

  // 7. GET /api/master-data/assembly-layers?sku=SKU123
  @Get('assembly-layers')
  async getAssemblyLayers(@Query('sku') sku: string) {
    if (!sku || sku.trim() === '') {
      throw new BadRequestException('SKU parameter is required');
    }
    return this.masterDataService.getAssemblyLayers(sku.trim());
  }

  // 8. GET /api/master-data/remain-quantity?customerPo=X&sku=Y&sCode=Z
  @Get('remain-quantity')
  async getRemainQuantity(
    @Query('customerPo') customerPo: string,
    @Query('sku') sku: string,
    @Query('sCode') sCode: string,
  ) {
    const trimmedCustomerPo = customerPo?.trim();
    const trimmedSku = sku?.trim();
    const trimmedSCode = sCode?.trim();

    if (!trimmedCustomerPo || !trimmedSku || !trimmedSCode) {
      throw new BadRequestException(
        'customerPo, sku, and sCode parameters are required and cannot be empty',
      );
    }

    return this.masterDataService.getRemainQuantity(
      trimmedCustomerPo,
      trimmedSku,
      trimmedSCode,
    );
  }

  // 9. GET /api/master-data/remain-quantity-department?customerPo=X&sku=Y&department=bonding
  // Generic endpoint untuk semua department (scalable)
  @Get('remain-quantity-department')
  async getRemainQuantityDepartment(
    @Query('customerPo') customerPo: string,
    @Query('sku') sku: string,
    @Query('department') department: string,
  ) {
    const trimmedCustomerPo = customerPo?.trim();
    const trimmedSku = sku?.trim();
    const trimmedDepartment = department?.trim();

    if (!trimmedCustomerPo || !trimmedSku || !trimmedDepartment) {
      throw new BadRequestException(
        'customerPo, sku, and department parameters are required and cannot be empty',
      );
    }

    return this.masterDataService.getRemainQuantityByDepartment(
      trimmedCustomerPo,
      trimmedSku,
      trimmedDepartment,
    );
  }

  // 10. GET /api/master-data/remain-quantity-bonding?customerPo=X&sku=Y
  // Backward compatibility - redirect ke method generic
  @Get('remain-quantity-bonding')
  async getRemainQuantityBonding(
    @Query('customerPo') customerPo: string,
    @Query('sku') sku: string,
  ) {
    const trimmedCustomerPo = customerPo?.trim();
    const trimmedSku = sku?.trim();

    if (!trimmedCustomerPo || !trimmedSku) {
      throw new BadRequestException(
        'customerPo and sku parameters are required and cannot be empty',
      );
    }

    return this.masterDataService.getRemainQuantityBonding(
      trimmedCustomerPo,
      trimmedSku,
    );
  }
}
