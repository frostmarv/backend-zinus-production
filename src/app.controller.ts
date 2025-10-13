// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipAuth } from './common/decorators/skip-auth.decorator';

@ApiTags('Application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get API welcome message' })
  @ApiResponse({
    status: 200,
    description: 'API welcome message returned successfully',
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @SkipAuth()
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Application health',
  })
  getHealth() {
    return this.appService.getHealth();
  }
}
