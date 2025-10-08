# 🔧 Environment Configuration Guide

Panduan lengkap untuk mengatur environment variables dengan mudah.

## 🚀 Quick Start

### 1. Pilih Environment (Super Mudah!)

```bash
# Development (SQLite)
npm run env:dev

# Local PostgreSQL  
npm run env:local-pg

# Production (Render.com)
npm run env:prod

# Docker deployment
npm run env:docker
```

### 2. Edit Database URL (Jika Perlu)

```bash
# Edit .env file yang sudah di-generate
nano .env

# Atau gunakan editor favorit
code .env
```

### 3. Start Application

```bash
npm run start:dev
```

## 📁 File Environment

| File | Kegunaan | Database |
|------|----------|----------|
| `.env.development` | Local development | SQLite |
| `.env.local-postgres` | Local dengan PostgreSQL | PostgreSQL (local) |
| `.env.production` | Production deployment | PostgreSQL (Render) |
| `.env.docker` | Docker deployment | PostgreSQL (external) |

## 🔄 Switching Environments

### Manual Switch
```bash
# Lihat opsi yang tersedia
npm run env:switch

# Switch ke environment tertentu
npm run env:switch dev
npm run env:switch prod
```

### Quick Commands
```bash
# Development + Start
npm run dev:sqlite

# Local PostgreSQL + Start  
npm run dev:postgres

# Just switch environment
npm run env:dev
npm run env:prod
```

## 🗄️ Database Configuration

### SQLite (Development)
```bash
NODE_ENV=development
DB_TYPE=sqlite
SQLITE_PATH=dev.sqlite
DB_SYNC=true
```

### PostgreSQL (Local)
```bash
NODE_ENV=development
DB_TYPE=postgres
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=zinus_dev
```

### PostgreSQL (Render.com)
```bash
NODE_ENV=production
DB_TYPE=postgres
DATABASE_URL=postgresql://user:pass@host:port/db
DB_SYNC=false
```

## 🔗 Database URL Format

### Render.com PostgreSQL
```
postgresql://zinus_user:PASSWORD@dpg-ID.singapore-postgres.render.com/zinus_production
```

### Local PostgreSQL
```
postgresql://postgres:password@localhost:5432/zinus_dev
```

### Heroku PostgreSQL
```
postgresql://user:pass@host:5432/database
```

## ⚙️ Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development`, `production` |
| `DB_TYPE` | Database type | `sqlite`, `postgres` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...` |
| `ALLOWED_ORIGINS` | CORS origins | `https://yourdomain.com` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `DB_SYNC` | `false` | Auto-sync database schema |
| `DB_LOGGING` | `false` | Enable database query logging |
| `LOG_LEVEL` | `info` | Application log level |

## 🛡️ Security Settings

### Development
```bash
DB_SYNC=true          # OK untuk development
DB_LOGGING=true       # OK untuk debugging
ALLOWED_ORIGINS=http://localhost:3000
```

### Production
```bash
DB_SYNC=false         # WAJIB false di production!
DB_LOGGING=false      # Disable untuk performance
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## 🔍 Validation & Debugging

### Automatic Validation
Aplikasi akan otomatis validasi environment variables saat startup:

```bash
✅ Environment validation passed
🔧 ZINUS BACKEND CONFIGURATION
==================================================
Environment: development
Database: sqlite
Port: 5000
SQLite File: dev.sqlite
DB Sync: true | Logging: true
CORS Origins: ✅ Configured
==================================================
```

### Production Warnings
```bash
⚠️  PRODUCTION WARNINGS:
   - DB_SYNC=true in production is dangerous
   - CORS not properly configured for production
```

## 🚨 Common Issues & Solutions

### 1. Database Connection Failed
```bash
# Check DATABASE_URL format
DATABASE_URL=postgresql://user:pass@host:port/database

# Or check individual params
PGHOST=your-host
PGUSER=your-user
PGPASSWORD=your-password
PGDATABASE=your-database
```

### 2. CORS Error
```bash
# Make sure ALLOWED_ORIGINS includes your frontend domain
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# For development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 3. Build Failed
```bash
# Check if all required variables are set
npm run verify:build

# Check environment validation
npm run start:dev
```

## 📋 Render.com Setup Checklist

### 1. Database Setup
- [x] Create PostgreSQL database di Render
- [x] Copy DATABASE_URL dari dashboard
- [x] Test connection

### 2. Environment Variables
```bash
NODE_ENV=production
DB_TYPE=postgres
DATABASE_URL=[paste dari step 1]
DB_SYNC=false
DB_LOGGING=false
ALLOWED_ORIGINS=https://yourdomain.com
```

### 3. Deployment
- [x] Connect GitHub repository
- [x] Set build/start commands
- [x] Deploy & test

## 🎯 Best Practices

### 1. Environment Separation
- ✅ Use different databases for dev/staging/prod
- ✅ Never use production data in development
- ✅ Keep sensitive data in environment variables

### 2. Security
- ✅ Always set `DB_SYNC=false` in production
- ✅ Configure CORS properly
- ✅ Use strong passwords
- ✅ Never commit `.env` files

### 3. Development Workflow
```bash
# Start new feature
npm run env:dev
npm run start:dev

# Test with PostgreSQL
npm run env:local-pg
npm run start:dev

# Deploy to production
npm run env:prod
# Edit DATABASE_URL in .env
npm run deploy:check
```

## 🆘 Need Help?

1. **Check validation**: Application will show errors on startup
2. **Use environment switcher**: `npm run env:switch`
3. **Check configuration**: Look for startup logs
4. **Test connection**: Use health check endpoint `/health`

---

**Happy Configuring! 🔧**