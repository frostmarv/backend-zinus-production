# Dockerfile
FROM node:18

WORKDIR /app

# Salin package.json
COPY package*.json ./

# Install SEMUA dependencies (termasuk dev) untuk build
RUN npm install

# Salin source code
COPY . .

# Build aplikasi (nest CLI sekarang tersedia)
RUN npm run build

# Setelah build, hapus devDependencies untuk hemat ukuran
RUN npm prune --production

# Expose port
EXPOSE 3000

# Jalankan dari dist
CMD ["node", "dist/main"]