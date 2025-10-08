# Deployment Guide - Railway.com

Panduan lengkap untuk deploy aplikasi NestJS backend ke Railway.com - platform deployment yang lebih mudah dan cepat!

## 📋 Prerequisites

- [x] Akun GitHub dengan repository ini
- [x] Akun Render.com (gratis)
- [x] Domain frontend (opsional, untuk CORS)

## 🚀 Deployment Steps

### 1. Persiapan Repository

Pastikan semua file deployment sudah ada:
- ✅ `render.yaml` - Konfigurasi deployment
- ✅ `Dockerfile` - Container configuration
- ✅ `.env.example` - Environment variables template
- ✅ `package.json` - Updated scripts

### 2. Setup Database di Render

1. **Login ke Render Dashboard**
   - Buka [render.com](https://render.com)
   - Login dengan GitHub

2. **Create PostgreSQL Database**
   ```
   Dashboard → New → PostgreSQL
   ```
   - **Name**: `zinus-postgres`
   - **Database**: `zinus_production`
   - **User**: `zinus_user`
   - **Region**: `Singapore` (terdekat dengan Indonesia)
   - **Plan**: `Free` (untuk testing)

3. **Catat Database Credentials**
   Setelah database dibuat, catat:
   - Internal Database URL
   - External Database URL
   - Host, Port, Database Name, Username, Password

### 3. Deploy Web Service

1. **Create Web Service**
   ```
   Dashboard → New → Web Service
   ```

2. **Connect Repository**
   - **Source**: Connect GitHub repository
   - **Repository**: `frostmarv/backend-zinus-production`
   - **Branch**: `main` (atau branch yang ingin di-deploy)

3. **Configure Service**
   - **Name**: `backend-zinus-production`
   - **Region**: `Singapore`
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm run start:prod`

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   DB_TYPE=postgres
   DB_SYNC=false
   DB_LOGGING=false
   PORT=10000
   DATABASE_URL=[paste dari database yang dibuat]
   ALLOWED_ORIGINS=https://your-frontend-domain.com
   ```

5. **Advanced Settings**
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: `Yes` (untuk auto-deploy dari GitHub)

### 4. Environment Variables Detail

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `DB_TYPE` | `postgres` | Database type |
| `DB_SYNC` | `false` | **PENTING**: Jangan sync di production |
| `DB_LOGGING` | `false` | Disable DB logging |
| `DATABASE_URL` | `postgresql://...` | From Render PostgreSQL |
| `ALLOWED_ORIGINS` | `https://yourdomain.com` | Frontend domains |
| `PORT` | `10000` | Render default port |

## 🔧 Alternative: Manual Deployment

Jika tidak menggunakan `render.yaml`:

### Option 1: GitHub Integration
1. Connect GitHub repository
2. Set build/start commands manually
3. Configure environment variables

### Option 2: Docker Deployment
1. Use provided `Dockerfile`
2. Render will auto-detect and build
3. Configure environment variables

## 🏥 Health Check

Aplikasi akan tersedia di:
```
https://your-service-name.onrender.com
```

Health check endpoint:
```
https://your-service-name.onrender.com/health
```

## 🔍 Troubleshooting

### Common Issues:

1. **Build Failed**
   ```bash
   # Check build logs di Render dashboard
   # Pastikan semua dependencies ada di package.json
   ```

2. **Database Connection Error**
   ```bash
   # Pastikan DATABASE_URL benar
   # Check database status di Render dashboard
   ```

3. **CORS Error**
   ```bash
   # Set ALLOWED_ORIGINS dengan domain frontend yang benar
   # Format: https://domain.com (tanpa trailing slash)
   ```

4. **Health Check Failed**
   ```bash
   # Pastikan endpoint /health tersedia
   # Check application logs
   ```

### Logs & Monitoring

- **Application Logs**: Render Dashboard → Service → Logs
- **Database Logs**: Render Dashboard → Database → Logs
- **Metrics**: Render Dashboard → Service → Metrics

## 💰 Pricing

### Free Tier Limits:
- **Web Service**: 750 jam/bulan, sleep setelah 15 menit idle
- **PostgreSQL**: 1GB storage, 1 bulan data retention
- **Bandwidth**: 100GB/bulan

### Upgrade Options:
- **Starter Plan**: $7/bulan - No sleep, custom domains
- **Standard Plan**: $25/bulan - More resources, priority support

## 🔐 Security Checklist

- [x] `NODE_ENV=production`
- [x] `DB_SYNC=false`
- [x] CORS configured dengan domain spesifik
- [x] Database credentials aman
- [x] No sensitive data di repository
- [x] Environment variables di Render dashboard

## 📚 Next Steps

1. **Custom Domain**: Setup domain kustom di Render
2. **SSL Certificate**: Otomatis tersedia
3. **Monitoring**: Setup alerts dan monitoring
4. **Backup**: Setup database backup strategy
5. **CI/CD**: Configure GitHub Actions untuk testing

## 🆘 Support

Jika ada masalah:
1. Check Render documentation
2. Check application logs
3. Verify environment variables
4. Test database connection
5. Contact Render support (jika perlu)

---

**Happy Deploying! 🚀**