import * as XLSX from 'xlsx';

/**
 * Descarga un archivo Excel (.xlsx) real con encabezados y filas de datos.
 */
export function downloadExcelFile(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  filename: string,
  sheetName: string = 'Datos'
) {
  const safeName = filename.endsWith('.xlsx') ? filename : `${filename.replace(/\.(csv|xls)$/i, '')}.xlsx`;
  const worksheetData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, safeName);
}

/**
 * Lee un archivo Excel (.xlsx / .xls) o CSV y devuelve un arreglo de objetos
 * usando los encabezados normalizados en minúsculas de la primera fila.
 */
export async function parseSpreadsheetFile(file: File): Promise<Record<string, any>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  return rawRows.map((row) => {
    const normalized: Record<string, any> = {};
    Object.entries(row).forEach(([key, value]) => {
      normalized[String(key).trim().toLowerCase()] = typeof value === 'string' ? value.trim() : value;
    });
    return normalized;
  });
}

