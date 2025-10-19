# Multi-stage build for production
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for time sync (optional but helpful for debugging)
RUN apk add --no-cache tzdata

# Set timezone (sesuai frontend: Asia/Jakarta)
ENV TZ=Asia/Jakarta
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci --omit=optional

# Copy source code
COPY . .

# Build the application
RUN npm run build


# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install tzdata for accurate time (critical for Google OAuth JWT)
RUN apk add --no-cache tzdata

# Set timezone to Asia/Jakarta
ENV TZ=Asia/Jakarta
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --omit=optional && npm cache clean --force

# Copy built app
COPY --from=builder /app/dist ./dist

# Ensure config directory exists (for optional file-based config)
RUN mkdir -p dist/config

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

USER nestjs

# Use PORT from environment (Render, Railway, etc.)
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/health', (res) => { console.log('Health check:', res.statusCode); process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', (e) => { console.error('Health check failed:', e); process.exit(1); })"

# Start app
CMD ["node", "dist/main.js"]