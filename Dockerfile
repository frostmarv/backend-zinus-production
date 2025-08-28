# Dockerfile
FROM node:18

WORKDIR /app

# Salin package.json
COPY package*.json ./

# Install semua dependencies
RUN npm install

# Salin kode
COPY . .

# Build aplikasi
RUN npm run build

# Hapus devDependencies
RUN npm prune --production

EXPOSE 3000

# Jalankan dengan polyfill di-load pertama
CMD ["node", "-r", "dist/polyfills", "dist/main"]