const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '');
}

function readWorkbook(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.csv') {
    const csvText = fs.readFileSync(filePath, 'utf8');
    return XLSX.read(csvText, { type: 'string' });
  }

  const buffer = fs.readFileSync(filePath);
  return XLSX.read(buffer, { type: 'buffer' });
}

function extractRowsFromFile(filePath) {
  const workbook = readWorkbook(filePath);
  if (!workbook.SheetNames.length) {
    return [];
  }

  function mapObjectRows(objectRows) {
    return objectRows.map((row) => {
      const normalized = {};

      Object.keys(row).forEach((key) => {
        normalized[normalizeHeader(key)] = row[key];
      });

      return {
        srNo: String(normalized.SRNO || normalized.SERIALNO || normalized.SR || '').trim(),
        serialNumber: String(
          normalized.SERIAL ||
            normalized.SERIALNUMBER ||
            normalized.SERIALFRAMENUMBER ||
            normalized.FRAME ||
            normalized.FRAMENUMBER ||
            ''
        ).trim(),
        name: String(normalized.NAME || '').trim()
      };
    });
  }

  function parseSheet(sheet) {
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    const mappedRows = mapObjectRows(rawRows);
    const hasValidRows = mappedRows.some((row) => row.serialNumber && row.name);
    if (hasValidRows) {
      return mappedRows;
    }

    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    let headerRowIndex = -1;
    let headerMap = [];

    for (let index = 0; index < Math.min(matrix.length, 8); index += 1) {
      const candidate = matrix[index] || [];
      const normalized = candidate.map((cell) => normalizeHeader(cell));
      if (normalized.includes('SERIAL') || normalized.includes('SERIALFRAMENUMBER') || normalized.includes('FRAMENUMBER')) {
        if (normalized.includes('NAME')) {
          headerRowIndex = index;
          headerMap = normalized;
          break;
        }
      }
    }

    if (headerRowIndex === -1) {
      return mappedRows;
    }

    const dataRows = matrix.slice(headerRowIndex + 1);
    return dataRows.map((row) => {
      const normalized = {};
      headerMap.forEach((header, idx) => {
        normalized[header] = row[idx];
      });

      return {
        srNo: String(normalized.SRNO || normalized.SERIALNO || normalized.SR || '').trim(),
        serialNumber: String(
          normalized.SERIAL ||
            normalized.SERIALNUMBER ||
            normalized.SERIALFRAMENUMBER ||
            normalized.FRAME ||
            normalized.FRAMENUMBER ||
            ''
        ).trim(),
        name: String(normalized.NAME || '').trim()
      };
    });
  }

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = parseSheet(sheet);
    if (rows.some((row) => row.serialNumber && row.name)) {
      return rows;
    }
  }

  const fallbackSheet = workbook.Sheets[workbook.SheetNames[0]];
  return parseSheet(fallbackSheet);
}

function inspectFile(filePath, sampleRows = 5) {
  const workbook = readWorkbook(filePath);
  const report = [];

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const headers = (matrix[0] || []).map((cell) => String(cell || '').trim());

    report.push({
      sheetName,
      headerRow: headers,
      sampleRows: matrix.slice(1, sampleRows + 1)
    });
  });

  return report;
}

module.exports = {
  extractRowsFromFile,
  normalizeHeader,
  inspectFile
};
