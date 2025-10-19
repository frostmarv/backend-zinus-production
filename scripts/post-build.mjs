#!/usr/bin/env node
import { mkdir, cp, access } from 'node:fs/promises';
import { constants } from 'node:fs';

const CONFIG_SRC = './src/config';
const CONFIG_DIST = './dist/config';

async function copyIfExists(src, dest) {
  try {
    await access(src, constants.F_OK);
    await cp(src, dest);
    console.log(`✅ Copied ${src} → ${dest}`);
  } catch {
    console.warn(`⚠️  Skipped missing file: ${src}`);
  }
}

async function main() {
  await mkdir(CONFIG_DIST, { recursive: true });

  // Salin file non-sensitif (.json.dist → .json)
  const distFiles = await import('node:child_process')
    .then(cp => {
      try {
        const { stdout } = cp.spawnSync('sh', ['-c', `ls ${CONFIG_SRC}/*.json.dist 2>/dev/null`]);
        return stdout.toString().trim().split('\n').filter(Boolean);
      } catch {
        return [];
      }
    });

  for (const file of distFiles) {
    const dest = file.replace(`${CONFIG_SRC}/`, `${CONFIG_DIST}/`).replace(/\.dist$/, '');
    await cp(file, dest);
    console.log(`✅ Copied config template: ${file} → ${dest}`);
  }

  // Opsional: salin file sensitif hanya jika ada (untuk dev/local)
  await copyIfExists(`${CONFIG_SRC}/google-services.json`, `${CONFIG_DIST}/google-services.json`);
  await copyIfExists(`${CONFIG_SRC}/service-account.json`, `${CONFIG_DIST}/service-account.json`);
  await copyIfExists(`${CONFIG_SRC}/sheet-config.json`, `${CONFIG_DIST}/sheet-config.json`);
}

main().catch(err => {
  console.error('❌ Post-build failed:', err);
  process.exit(1);
});