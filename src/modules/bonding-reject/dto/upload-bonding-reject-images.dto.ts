// src/modules/bonding-reject/dto/upload-bonding-reject-images.dto.ts
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UploadBondingRejectImagesDto {
  // ❌ Tidak ada field input di sini — file diambil dari req.files
  // Tapi tetap buat DTO kosong untuk konsistensi API
}
