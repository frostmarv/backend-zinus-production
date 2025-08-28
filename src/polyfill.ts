// src/polyfill.ts
import * as crypto from "crypto";

// Patch crypto agar dikenali sebagai global (untuk TypeORM)
if (!(global as any).crypto) {
  (global as any).crypto = crypto;
}
