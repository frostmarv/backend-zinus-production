import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get application welcome message' })
  @ApiResponse({ status: 200, description: 'Welcome message returned successfully' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint for monitoring' })
  @ApiResponse({ 
    status: 200, 
    description: 'Application is healthy',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2025-01-20T10:30:00.000Z',
        uptime: 3600.123,
        environment: 'production',
        version: '0.0.1',
        database: 'connected'
      }
    }
  })
  getHealth() {
    return this.appService.getHealth();
  }
}
