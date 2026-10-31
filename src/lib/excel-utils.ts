import * as XLSX from 'xlsx';
import { FieldDef } from './import-export-definitions';

export interface ParsedSpreadsheet {
  sheetNames: string[];
  activeSheet: string;
  headers: string[];
  rawRows: Record<string, any>[];
  totalRows: number;
}

/**
 * Parses an Excel (.xlsx, .xls) or CSV file in the browser.
 */
export async function parseSpreadsheetFile(file: File): Promise<ParsedSpreadsheet> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false,
  });

  const sheetNames = workbook.SheetNames;
  if (!sheetNames || sheetNames.length === 0) {
    throw new Error('The uploaded spreadsheet contains no sheets.');
  }

  const activeSheet = sheetNames[0];
  const worksheet = workbook.Sheets[activeSheet];

  // Convert sheet to JSON as array of arrays first to inspect header row
  const aoa: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (!aoa || aoa.length === 0) {
    throw new Error('The uploaded spreadsheet is empty.');
  }

  // Find first row with non-empty cells to use as headers
  let headerRowIndex = 0;
  while (headerRowIndex < aoa.length && (!aoa[headerRowIndex] || aoa[headerRowIndex].every((c) => !String(c).trim()))) {
    headerRowIndex++;
  }

  if (headerRowIndex >= aoa.length) {
    throw new Error('No headers found in the uploaded file.');
  }

  const rawHeaders = aoa[headerRowIndex].map((h, i) => {
    const val = String(h ?? '').trim();
    return val || `Column_${i + 1}`;
  });

  // Extract subsequent data rows
  const rawRows: Record<string, any>[] = [];
  for (let r = headerRowIndex + 1; r < aoa.length; r++) {
    const row = aoa[r];
    if (!row || row.every((c) => c === '' || c === null || c === undefined)) {
      continue; // Skip entirely empty rows
    }

    const rowObj: Record<string, any> = {};
    let hasNonEmpty = false;

    rawHeaders.forEach((header, colIndex) => {
      let cellVal = row[colIndex];
      if (cellVal instanceof Date) {
        cellVal = cellVal.toISOString().split('T')[0];
      } else if (typeof cellVal === 'string') {
        cellVal = cellVal.trim();
      }
      rowObj[header] = cellVal ?? '';
      if (cellVal !== '' && cellVal !== null && cellVal !== undefined) {
        hasNonEmpty = true;
      }
    });

    if (hasNonEmpty) {
      rawRows.push(rowObj);
    }
  }

  return {
    sheetNames,
    activeSheet,
    headers: rawHeaders,
    rawRows,
    totalRows: rawRows.length,
  };
}

/**
 * Auto-detects matching system fields for detected file headers.
 */
export function autoMapColumns(
  headers: string[],
  availableFields: FieldDef[]
): Record<string, string> {
  const mapping: Record<string, string> = {};
  const mappedKeys = new Set<string>();

  headers.forEach((header) => {
    const cleanHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');

    for (const field of availableFields) {
      if (mappedKeys.has(field.key)) continue;

      // Exact key match
      if (field.key.toLowerCase() === cleanHeader) {
        mapping[header] = field.key;
        mappedKeys.add(field.key);
        return;
      }

      // Check synonyms
      if (field.synonyms) {
        const match = field.synonyms.some((syn) => {
          const cleanSyn = syn.toLowerCase().replace(/[^a-z0-9]/g, '');
          return cleanHeader === cleanSyn || cleanHeader.includes(cleanSyn) || cleanSyn.includes(cleanHeader);
        });

        if (match) {
          mapping[header] = field.key;
          mappedKeys.add(field.key);
          return;
        }
      }

      // Check clean field label
      const cleanLabel = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanLabel.includes(cleanHeader) || cleanHeader.includes(cleanLabel)) {
        mapping[header] = field.key;
        mappedKeys.add(field.key);
        return;
      }
    }

    // Default to skip/unmapped
    mapping[header] = '';
  });

  return mapping;
}

/**
 * Exports data to an Excel (.xlsx) or CSV (.csv) file with customizable selected fields.
 */
export function exportToSpreadsheet({
  data,
  selectedFields,
  filename,
  format,
  sheetTitle = 'Sheet1',
}: {
  data: any[];
  selectedFields: FieldDef[];
  filename: string;
  format: 'xlsx' | 'csv';
  sheetTitle?: string;
}) {
  if (selectedFields.length === 0) {
    throw new Error('Please select at least one field to export.');
  }

  // Header row
  const headers = selectedFields.map((f) => f.label);

  // Data rows
  const rows = data.map((item) => {
    return selectedFields.map((field) => {
      let val = item[field.key];

      if (val === null || val === undefined) return '';

      if (field.type === 'boolean') {
        return val ? 'Active' : 'Inactive';
      }

      if (typeof val === 'number') {
        return Number(val);
      }

      return String(val);
    });
  });

  const aoa = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);

  // Set column widths based on max content length
  const colWidths = headers.map((header, colIdx) => {
    let maxLen = header.length;
    for (let r = 0; r < Math.min(rows.length, 50); r++) {
      const cellVal = String(rows[r][colIdx] ?? '');
      if (cellVal.length > maxLen) maxLen = cellVal.length;
    }
    return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
  });

  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle.slice(0, 31));

  const cleanFilename = filename.endsWith(`.${format}`) ? filename : `${filename}.${format}`;

  if (format === 'csv') {
    XLSX.writeFile(workbook, cleanFilename, { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, cleanFilename, { bookType: 'xlsx' });
  }
}

/**
 * Generates and downloads a sample blank template file with illustrative rows.
 */
export function generateSampleTemplate({
  selectedFields,
  filename,
  format,
  sheetTitle = 'Sample Template',
}: {
  selectedFields: FieldDef[];
  filename: string;
  format: 'xlsx' | 'csv';
  sheetTitle?: string;
}) {
  const headers = selectedFields.map((f) => f.label);

  // Two rows of realistic sample values
  const row1 = selectedFields.map((f) => (f.sampleValues && f.sampleValues[0] !== undefined ? f.sampleValues[0] : ''));
  const row2 = selectedFields.map((f) => (f.sampleValues && f.sampleValues[1] !== undefined ? f.sampleValues[1] : ''));

  const aoa = [headers, row1, row2];
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);

  const colWidths = headers.map((header, colIdx) => {
    const s1 = String(row1[colIdx] ?? '').length;
    const s2 = String(row2[colIdx] ?? '').length;
    const maxLen = Math.max(header.length, s1, s2);
    return { wch: Math.min(Math.max(maxLen + 4, 14), 35) };
  });

  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle.slice(0, 31));

  const cleanFilename = filename.endsWith(`.${format}`) ? filename : `${filename}.${format}`;

  if (format === 'csv') {
    XLSX.writeFile(workbook, cleanFilename, { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, cleanFilename, { bookType: 'xlsx' });
  }
}
