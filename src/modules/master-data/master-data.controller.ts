// src/modules/master-data/master-data.controller.ts
import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { MasterDataService } from './master-data.service';

@Controller('master-data')
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  @Get('customers')
  async getCustomers() {
    return this.masterDataService.getCustomers();
  }

  @Get('po-numbers')
  async getPoNumbers(@Query('customerId') customerId: string) {
    if (!customerId) {
      throw new BadRequestException('customerId is required');
    }
    return this.masterDataService.getPoNumbers(Number(customerId));
  }

  @Get('customer-pos')
  async getCustomerPos(@Query('poNumber') poNumber: string) {
    if (!poNumber) {
      throw new BadRequestException('poNumber is required');
    }
    return this.masterDataService.getCustomerPos(poNumber);
  }

  @Get('skus')
  async getSkus(@Query('customerPo') customerPo: string) {
    if (!customerPo) {
      throw new BadRequestException('customerPo is required');
    }
    return this.masterDataService.getSkus(customerPo);
  }

  @Get('qty-plans')
  async getQtyPlans(
    @Query('customerPo') customerPo: string,
    @Query('sku') sku: string,
  ) {
    if (!customerPo || !sku) {
      throw new BadRequestException('customerPo and sku are required');
    }
    return this.masterDataService.getQtyPlans(customerPo, sku);
  }

  @Get('weeks')
  async getWeeks(
    @Query('customerPo') customerPo: string,
    @Query('sku') sku: string,
  ) {
    if (!customerPo || !sku) {
      throw new BadRequestException('customerPo and sku are required');
    }
    return this.masterDataService.getWeeks(customerPo, sku);
  }

  @Get('assembly-layers')
  async getAssemblyLayers(@Query('sku') sku: string) {
    if (!sku || sku.trim() === '') {
      throw new BadRequestException('SKU parameter is required');
    }
    return this.masterDataService.getAssemblyLayers(sku.trim());
  }

  // 🔥 Baru: Endpoint untuk remain quantity di cutting
  @Get('remain-quantity-cutting')
  async getRemainQuantityCutting(
    @Query('customerPo') customerPo: string,
    @Query('sku') sku: string,
    @Query('sCode') sCode: string,
  ) {
    const trimmedCustomerPo = customerPo?.trim();
    const trimmedSku = sku?.trim();
    const trimmedSCode = sCode?.trim();

    if (!trimmedCustomerPo || !trimmedSku || !trimmedSCode) {
      throw new BadRequestException(
        'customerPo, sku, and sCode are required and cannot be empty',
      );
    }

    return this.masterDataService.getRemainQuantityForCutting(
      trimmedCustomerPo,
      trimmedSku,
      trimmedSCode,
    );
  }

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
