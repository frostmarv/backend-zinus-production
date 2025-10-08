<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Backend API untuk sistem produksi Zinus menggunakan NestJS framework. Aplikasi ini mengelola production orders, cutting records, dan proses manufaktur lainnya.

## Features

- 🏭 **Production Order Management** - Kelola pesanan produksi
- ✂️ **Cutting Records** - Tracking proses cutting dengan detail balok dan actual data
- 📊 **Health Monitoring** - Health check endpoint untuk monitoring
- 🗄️ **Multi-Database Support** - SQLite (development) dan PostgreSQL (production)
- 🔒 **Input Validation** - Comprehensive validation dengan class-validator
- 📚 **API Documentation** - Swagger/OpenAPI documentation
- 🐳 **Docker Ready** - Containerized deployment
- ☁️ **Cloud Deploy Ready** - Optimized untuk Render.com

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## API Endpoints

### Production Orders
- `GET /api/orders` - Get all production orders
- `POST /api/orders` - Create new production order

### Cutting Records  
- `GET /api/cutting` - Get all cutting records
- `POST /api/cutting` - Create new cutting record
- `GET /api/cutting/:id` - Get cutting record by ID
- `PUT /api/cutting/:id` - Update cutting record
- `DELETE /api/cutting/:id` - Delete cutting record

### Health Check
- `GET /health` - Application health status

## Environment Configuration

### 🚀 Quick Setup (Super Mudah!)

```bash
# Development (SQLite)
npm run env:dev && npm run start:dev

# Local PostgreSQL
npm run env:local-pg && npm run start:dev

# Production setup
npm run env:prod
# Edit DATABASE_URL di .env, lalu:
npm run start:prod
```

### 📁 Environment Files

| Command | File | Database | Use Case |
|---------|------|----------|----------|
| `npm run env:dev` | `.env.development` | SQLite | Local development |
| `npm run env:local-pg` | `.env.local-postgres` | PostgreSQL | Local testing |
| `npm run env:prod` | `.env.production` | PostgreSQL | Production |
| `npm run env:railway` | `.env.railway` | PostgreSQL | Railway.com |
| `npm run env:docker` | `.env.docker` | PostgreSQL | Docker deploy |

### 🔧 Manual Configuration

Edit `.env` file:
```bash
# Quick switch environments
NODE_ENV=development              # development | production
DB_TYPE=sqlite                   # sqlite | postgres

# SQLite (Development)
SQLITE_PATH=dev.sqlite

# PostgreSQL (Production)
DATABASE_URL=postgresql://user:pass@host:port/db

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

📖 **Panduan Lengkap**: [ENV_GUIDE.md](./ENV_GUIDE.md)

## Deployment

### 🚄 Quick Deploy ke Railway.com

**5 menit setup:**

1. **Login**: [railway.app](https://railway.app)
2. **New Project**: Deploy from GitHub repo
3. **Set Variables**: DATABASE_URL sudah tersedia
4. **Done!** ✅

📖 **Panduan Lengkap**: 
- [RAILWAY_SETUP.md](./RAILWAY_SETUP.md) - Quick start (5 menit)
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Panduan detail

### 🐳 Docker Deployment

```bash
# Build image
docker build -t zinus-backend .

# Run container
docker run -p 5000:5000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://... \
  zinus-backend
```

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
