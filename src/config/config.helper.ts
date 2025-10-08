// src/config/config.helper.ts
import { ConfigService } from '@nestjs/config';

export class ConfigHelper {
  constructor(private configService: ConfigService) {}

  /**
   * Print configuration summary (without sensitive data)
   */
  printConfigSummary() {
    const nodeEnv = this.configService.get('NODE_ENV', 'development');
    const dbType = this.configService.get('DB_TYPE', 'sqlite');
    const port = this.configService.get('PORT', 5000);
    
    console.log('\n' + '='.repeat(50));
    console.log('🔧 ZINUS BACKEND CONFIGURATION');
    console.log('='.repeat(50));
    console.log(`Environment: ${nodeEnv}`);
    console.log(`Database: ${dbType}`);
    console.log(`Port: ${port}`);
    
    if (dbType === 'postgres') {
      const hasUrl = !!this.configService.get('DATABASE_URL');
      const host = this.configService.get('PGHOST', 'localhost');
      const dbName = this.configService.get('PGDATABASE', 'postgres');
      
      console.log(`DB Connection: ${hasUrl ? 'DATABASE_URL' : `${host}/${dbName}`}`);
    } else {
      const sqlitePath = this.configService.get('SQLITE_PATH', 'dev.sqlite');
      console.log(`SQLite File: ${sqlitePath}`);
    }
    
    const dbSync = this.configService.get('DB_SYNC', 'false');
    const dbLogging = this.configService.get('DB_LOGGING', 'false');
    console.log(`DB Sync: ${dbSync} | Logging: ${dbLogging}`);
    
    const origins = this.configService.get('ALLOWED_ORIGINS', 'not-set');
    console.log(`CORS Origins: ${origins === 'not-set' ? '⚠️  Not configured' : '✅ Configured'}`);
    
    console.log('='.repeat(50) + '\n');
  }

  /**
   * Validate critical production settings
   */
  validateProductionConfig(): string[] {
    const warnings: string[] = [];
    const nodeEnv = this.configService.get('NODE_ENV');
    
    if (nodeEnv === 'production') {
      // Check DB_SYNC
      if (this.configService.get('DB_SYNC') === 'true') {
        warnings.push('DB_SYNC=true in production is dangerous');
      }
      
      // Check CORS
      const origins = this.configService.get('ALLOWED_ORIGINS');
      if (!origins || origins.includes('*')) {
        warnings.push('CORS not properly configured for production');
      }
      
      // Check database type
      if (this.configService.get('DB_TYPE') === 'sqlite') {
        warnings.push('SQLite not recommended for production');
      }
      
      // Check database connection
      const dbType = this.configService.get('DB_TYPE');
      if (dbType === 'postgres') {
        const hasUrl = !!this.configService.get('DATABASE_URL');
        const hasIndividual = !!(
          this.configService.get('PGHOST') && 
          this.configService.get('PGUSER') && 
          this.configService.get('PGDATABASE')
        );
        
        if (!hasUrl && !hasIndividual) {
          warnings.push('PostgreSQL connection not properly configured');
        }
      }
    }
    
    return warnings;
  }

  /**
   * Get database connection info for logging
   */
  getDatabaseInfo() {
    const dbType = this.configService.get('DB_TYPE', 'sqlite');
    
    if (dbType === 'postgres') {
      const hasUrl = !!this.configService.get('DATABASE_URL');
      return {
        type: 'PostgreSQL',
        connection: hasUrl ? 'DATABASE_URL' : 'Individual params',
        host: hasUrl ? '[from URL]' : this.configService.get('PGHOST', 'localhost'),
        database: hasUrl ? '[from URL]' : this.configService.get('PGDATABASE', 'postgres'),
      };
    }
    
    return {
      type: 'SQLite',
      connection: 'File',
      file: this.configService.get('SQLITE_PATH', 'dev.sqlite'),
    };
  }
}