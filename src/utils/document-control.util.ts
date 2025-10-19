// src/utils/document-control.util.ts
import dayjs from 'dayjs';

export function generateDocNumber(
  deptCode: string,
  docType: string,
  shift: string,
  groupCode: string,
) {
  const datePart = dayjs().format('YYYYMM');
  return `ZDI/${deptCode}/${docType}/${datePart}-${shift}/${groupCode}`;
}
