import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as crypto from 'crypto';

// ✅ Patch supaya TypeORM bisa pakai randomUUID()
if (!(global as any).crypto) {
  (global as any).crypto = crypto;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Gunakan PORT dari env (Railway) atau fallback 3000
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}`);
}
bootstrap();
