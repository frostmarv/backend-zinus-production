import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionOrderService } from './production-order.service';
import { ProductionOrder } from './production-order.entity';
import { CreateProductionOrderDto } from './dto/create-production-order.dto';

describe('ProductionOrderService', () => {
  let service: ProductionOrderService;
  let repository: Repository<ProductionOrder>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionOrderService,
        {
          provide: getRepositoryToken(ProductionOrder),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductionOrderService>(ProductionOrderService);
    repository = module.get<Repository<ProductionOrder>>(getRepositoryToken(ProductionOrder));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a production order with valid data', async () => {
      const dto: CreateProductionOrderDto = {
        productCode: 'PROD-001',
        productName: 'Test Product',
        quantity: 10,
        notes: 'Test notes',
      };

      const mockOrder = { id: '1', ...dto, createdAt: new Date() };
      mockRepository.create.mockReturnValue(mockOrder);
      mockRepository.save.mockResolvedValue(mockOrder);

      const result = await service.create(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockOrder);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('findAll', () => {
    it('should return all production orders', async () => {
      const mockOrders = [
        { id: '1', productCode: 'PROD-001', productName: 'Product 1', quantity: 10 },
        { id: '2', productCode: 'PROD-002', productName: 'Product 2', quantity: 5 },
      ];
      mockRepository.find.mockResolvedValue(mockOrders);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockOrders);
    });
  });
});
