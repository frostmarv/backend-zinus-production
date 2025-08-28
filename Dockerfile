# Dockerfile
FROM node:18-alpine

# Buat folder aplikasi
WORKDIR /app

# Salin package.json & package-lock.json dulu
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production && npm cache clean --force

# Salin source code (setelah node_modules di-ignore)
COPY . .

# Build aplikasi (opsional, tapi direkomendasikan untuk production)
# Hapus comment jika kamu pakai build
RUN npm run build

# Bersihkan dev dependencies (opsional)
RUN npm ci --only=production

# Expose port
EXPOSE 3000

# Jalankan aplikasi dari dist/main
CMD ["node", "dist/main"]