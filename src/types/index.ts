// types/index.ts
export interface SheetConfig {
  sheetName: string;
  spreadsheetId: string;
}

export interface DepartmentConfig {
  [dataType: string]: SheetConfig;
}

export interface SheetsConfig {
  SPREADSHEET_MASTER: string;
  departments: {
    [department: string]: DepartmentConfig;
  };
}

// Data Cutting Summary
export interface CuttingSummaryEntry {
  customer: string;
  customerPO: string;
  poNumber: string;
  sku: string;
  sCode: string;
  quantityOrder: number;
  quantityProduksi: number;
  remainQuantity: number;
  week: string;
}

export interface CuttingSummaryPayload {
  timestamp: string;
  shift: string;
  group: string;
  time: string;
  entries: CuttingSummaryEntry[];
}
