# 🚀 Quick Setup Guide - Render.com

Panduan singkat untuk deploy ke Render.com dalam 10 menit.

## ⚡ Quick Start

### 1. Persiapan (2 menit)
```bash
# Clone repository (jika belum)
git clone https://github.com/frostmarv/backend-zinus-production.git
cd backend-zinus-production

# Pastikan semua file deployment ada
ls render.yaml Dockerfile .env.example DEPLOYMENT.md
```

### 2. Setup Database (3 menit)

1. **Login ke Render**: [render.com](https://render.com)
2. **New → PostgreSQL**:
   - Name: `zinus-postgres`
   - Database: `zinus_production` 
   - User: `zinus_user`
   - Region: `Singapore`
   - Plan: `Free`
3. **Copy DATABASE_URL** dari dashboard

### 3. Deploy Web Service (5 menit)

1. **New → Web Service**
2. **Connect GitHub**: `frostmarv/backend-zinus-production`
3. **Configuration**:
   ```
   Name: backend-zinus-production
   Region: Singapore
   Branch: main
   Runtime: Node
   Build Command: npm ci && npm run build
   Start Command: npm run start:prod
   ```

4. **Environment Variables**:
   ```bash
   NODE_ENV=production
   DB_TYPE=postgres
   DB_SYNC=false
   DB_LOGGING=false
   DATABASE_URL=[paste dari step 2]
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

5. **Advanced Settings**:
   - Health Check Path: `/health`
   - Auto-Deploy: `Yes`

6. **Deploy** 🚀

## ✅ Verification

Setelah deploy selesai:

1. **Check Health**: `https://your-app.onrender.com/health`
2. **Test API**: `https://your-app.onrender.com/api/orders`
3. **Check Logs**: Render Dashboard → Logs

## 🔧 Environment Variables Lengkap

| Variable | Value | Required |
|----------|-------|----------|
| `NODE_ENV` | `production` | ✅ |
| `DB_TYPE` | `postgres` | ✅ |
| `DB_SYNC` | `false` | ✅ |
| `DB_LOGGING` | `false` | ✅ |
| `DATABASE_URL` | `postgresql://...` | ✅ |
| `ALLOWED_ORIGINS` | `https://yourdomain.com` | ✅ |
| `PORT` | `10000` | Auto-set |

## 🆘 Troubleshooting

### Build Failed
```bash
# Check di Render Logs:
# - Missing dependencies
# - TypeScript errors
# - Build timeout
```

### Database Error
```bash
# Verify DATABASE_URL format:
postgresql://user:password@host:port/database

# Check database status di Render dashboard
```

### Health Check Failed
```bash
# Test endpoint:
curl https://your-app.onrender.com/health

# Should return:
{
  "status": "ok",
  "database": "connected",
  ...
}
```

## 📱 Next Steps

1. **Custom Domain**: Setup di Render dashboard
2. **SSL**: Otomatis aktif
3. **Monitoring**: Setup alerts
4. **Frontend**: Update API URL ke Render domain

---

**Total waktu setup: ~10 menit** ⏱️

Butuh bantuan? Check [DEPLOYMENT.md](./DEPLOYMENT.md) untuk panduan lengkap.