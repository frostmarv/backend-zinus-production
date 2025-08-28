// src/polyfills.ts
import * as crypto from 'crypto';

// Fix: global.crypto
if (typeof global.crypto === 'undefined') {
  (global as any).crypto = crypto;
}

// Fix: crypto.randomUUID
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
      .replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }) as `${string}-${string}-${string}-${string}-${string}`;
  };
}