# Dockerfile
FROM node:18-alpine

# Buat folder app
WORKDIR /app

# Salin package.json dulu (biar cache npm install lebih cepat)
COPY package*.json ./

# Install dependencies
RUN npm install

# Salin semua file source code
COPY . .

# Build aplikasi (opsional, jika pakai production build)
# RUN npm run build

# Expose port 3000
EXPOSE 3000

# Jalankan aplikasi
CMD ["npm", "run", "start"]