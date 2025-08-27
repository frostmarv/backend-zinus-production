import { Test, TestingModule } from '@nestjs/testing';
import { ProductionOrderService } from './production-order.service';

describe('ProductionOrderService', () => {
  let service: ProductionOrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductionOrderService],
    }).compile();

    service = module.get<ProductionOrderService>(ProductionOrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
