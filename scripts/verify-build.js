#!/usr/bin/env node

/**
 * Build verification script for Render deployment
 * This script checks if the build artifacts are properly created
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying build artifacts...\n');

const requiredFiles = [
  'dist/main.js',
  'dist/app.module.js',
  'dist/app.controller.js',
  'dist/app.service.js',
  'dist/config/database.config.js',
  'dist/modules/production-order/production-order.module.js',
  'dist/modules/cutting/cutting.module.js',
];

const requiredDirs = [
  'dist',
  'dist/config',
  'dist/modules',
  'dist/modules/production-order',
  'dist/modules/cutting',
];

let allGood = true;

// Check directories
console.log('📁 Checking directories:');
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`  ✅ ${dir}`);
  } else {
    console.log(`  ❌ ${dir} - MISSING`);
    allGood = false;
  }
});

console.log('\n📄 Checking files:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`  ✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allGood = false;
  }
});

// Check package.json
console.log('\n📦 Checking package.json:');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`  ✅ Name: ${pkg.name}`);
  console.log(`  ✅ Version: ${pkg.version}`);
  console.log(`  ✅ Start script: ${pkg.scripts['start:prod']}`);
  console.log(`  ✅ Build script: ${pkg.scripts.build}`);
} catch (error) {
  console.log(`  ❌ Error reading package.json: ${error.message}`);
  allGood = false;
}

// Check environment files
console.log('\n🔧 Checking configuration files:');
const configFiles = ['.env.example', 'render.yaml', 'Dockerfile'];
configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ⚠️  ${file} - Optional but recommended`);
  }
});

console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('🎉 Build verification PASSED! Ready for deployment.');
  process.exit(0);
} else {
  console.log('❌ Build verification FAILED! Please fix the issues above.');
  process.exit(1);
}