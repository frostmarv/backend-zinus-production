#!/usr/bin/env node

/**
 * Environment Switcher Script
 * Easily switch between different environment configurations
 */

const fs = require('fs');
const path = require('path');

const environments = {
  dev: '.env.development',
  'local-pg': '.env.local-postgres', 
  prod: '.env.production',
  docker: '.env.docker'
};

const envName = process.argv[2];

if (!envName) {
  console.log('🔧 Environment Switcher\n');
  console.log('Usage: npm run env:switch <environment>\n');
  console.log('Available environments:');
  console.log('  dev        - Local development (SQLite)');
  console.log('  local-pg   - Local PostgreSQL');
  console.log('  prod       - Production (Render.com)');
  console.log('  docker     - Docker deployment\n');
  console.log('Example: npm run env:switch dev');
  process.exit(1);
}

const envFile = environments[envName];
if (!envFile) {
  console.log(`❌ Unknown environment: ${envName}`);
  console.log(`Available: ${Object.keys(environments).join(', ')}`);
  process.exit(1);
}

const sourcePath = path.join(__dirname, '..', envFile);
const targetPath = path.join(__dirname, '..', '.env');

if (!fs.existsSync(sourcePath)) {
  console.log(`❌ Environment file not found: ${envFile}`);
  process.exit(1);
}

try {
  // Backup current .env if exists
  if (fs.existsSync(targetPath)) {
    const backupPath = `${targetPath}.backup.${Date.now()}`;
    fs.copyFileSync(targetPath, backupPath);
    console.log(`📋 Backed up current .env to: ${path.basename(backupPath)}`);
  }

  // Copy new environment file
  fs.copyFileSync(sourcePath, targetPath);
  
  console.log(`✅ Switched to ${envName} environment`);
  console.log(`📄 Active config: ${envFile}`);
  
  // Show current config summary
  const content = fs.readFileSync(targetPath, 'utf8');
  const lines = content.split('\n').filter(line => 
    line.trim() && 
    !line.startsWith('#') && 
    line.includes('=')
  );
  
  console.log('\n📊 Current configuration:');
  lines.slice(0, 8).forEach(line => {
    const [key, value] = line.split('=');
    // Hide sensitive values
    const displayValue = key.includes('PASSWORD') || key.includes('SECRET') || key.includes('URL') 
      ? '[HIDDEN]' 
      : value;
    console.log(`  ${key}=${displayValue}`);
  });
  
  if (lines.length > 8) {
    console.log(`  ... and ${lines.length - 8} more settings`);
  }
  
  console.log('\n🚀 Ready to start the application!');
  
} catch (error) {
  console.log(`❌ Error switching environment: ${error.message}`);
  process.exit(1);
}