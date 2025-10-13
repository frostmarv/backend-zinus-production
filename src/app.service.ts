// src/app.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthService } from './modules/auth/auth.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private authService: AuthService, // 👈 Inject AuthService
  ) {}

  async onModuleInit() {
    // Auto-create user awal hanya di development
    if (process.env.NODE_ENV !== 'production') {
      await this.authService.createInitialUser();
    }
  }

  getHello(): string {
    return 'Zinus Production Backend API - Ready to serve! 🚀';
  }

  async getHealth() {
    const startTime = process.hrtime();
    let databaseStatus = 'disconnected';

    try {
      await this.dataSource.query('SELECT 1');
      databaseStatus = 'connected';
    } catch (error) {
      console.error('Database health check failed:', error.message);
      databaseStatus = 'error';
    }

    const [seconds, nanoseconds] = process.hrtime(startTime);
    const responseTime = seconds * 1000 + nanoseconds / 1e6;

    return {
      status: databaseStatus === 'connected' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.0.1',
      database: databaseStatus,
      responseTime: `${responseTime.toFixed(2)}ms`,
      memory: {
        used:
          Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) /
          100,
        total:
          Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) /
          100,
        unit: 'MB',
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid,
      },
    };
  }
}
