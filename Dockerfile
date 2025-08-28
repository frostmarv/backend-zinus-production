# Dockerfile
FROM node:18

WORKDIR /app

# Salin package.json
COPY package*.json ./
RUN npm install

# Salin kode
COPY . .

# Build aplikasi
RUN npm run build

# Hapus devDependencies
RUN npm prune --production

EXPOSE 3000

# Jalankan aplikasi (polyfills sudah di-import di main.ts)
CMD ["node", "dist/main"]