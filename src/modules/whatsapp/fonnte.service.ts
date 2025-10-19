// src/whatsapp/fonnte.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';

@Injectable()
export class FonnteService {
  private readonly FONNTE_API_URL = 'https://api.fonnte.com/send'; // Hapus spasi di akhir
  private readonly FONNTE_TOKEN = process.env.FONNTE_API_TOKEN;

  async sendWhatsApp(to: string, message: string): Promise<any> {
    if (!this.FONNTE_TOKEN) {
      throw new Error('FONNTE_API_TOKEN belum diset di environment!');
    }

    const form = new FormData();
    form.append('target', to); // contoh: '081234567890'
    form.append('message', message);

    try {
      const response = await axios.post(this.FONNTE_API_URL, form, {
        headers: {
          Authorization: this.FONNTE_TOKEN,
          ...form.getHeaders(), // Penting untuk FormData
        },
        // @ts-ignore: maxContentLength adalah properti internal axios/request
        maxContentLength: Infinity,
        // @ts-ignore: maxBodyLength adalah properti internal axios/request
        maxBodyLength: Infinity,
      });

      return response.data;
    } catch (error) {
      console.error('❌ Gagal kirim WhatsApp via Fonnte:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error('Gagal mengirim notifikasi WhatsApp');
    }
  }
}
