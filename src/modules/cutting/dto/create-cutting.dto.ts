// src/modules/cutting/dto/create-cutting.dto.ts
export class CreateBalokDto {
  density?: string;
  ild?: string;
  colour: string;
  length?: number;
  width?: number;
  height?: number;
  sizeActual?: string;
  qtyBalok?: number;
}

export class CreateCuttingDto {
  header: {
    timestamp: string;
    shift: string;
    group: string;
    machine: string;
    timeSlot: string;
    week?: string;
  };
  balok: CreateBalokDto[];
  foamingDate: {
    isChecked: boolean;
    tanggalSelesai?: string;
    jam?: string;
  } | null;
}
