const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const { extractRowsFromFile, inspectFile } = require('../utils/fileParser');
const cycleService = require('./cycleService');

function normalizeRecord(row) {
  const serialNumber = String(row.serialNumber || '').trim();
  const name = String(row.name || '').trim();
  const srNo = String(row.srNo || '').trim();

  if (!serialNumber || !name) {
    return null;
  }

  return {
    srNo,
    serialNumber,
    name
  };
}

async function importUploadedFile(filePath, filename) {
  const rows = extractRowsFromFile(filePath);
  const totalRows = rows.length;
  const records = [];
  let skipped = 0;
  const seen = new Set();

  rows.forEach((row) => {
    const record = normalizeRecord(row);
    if (!record) {
      skipped += 1;
      return;
    }

    if (seen.has(record.serialNumber)) {
      skipped += 1;
      return;
    }

    seen.add(record.serialNumber);
    records.push(record);
  });

  await cycleService.bulkUpsertCycles(records);
  await cycleService.logUpload({
    filename,
    totalRows,
    inserted: records.length,
    skipped
  });

  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return {
    totalRows,
    inserted: records.length,
    skipped,
    rows: records
  };
}

function previewFile(filePath, limit = 10) {
  const rows = extractRowsFromFile(filePath).filter((row) => row.serialNumber && row.name);
  return rows.slice(0, limit).map((row) => ({
    srNo: row.srNo,
    serialNumber: row.serialNumber,
    name: row.name
  }));
}

function inspectUploadedFile(filePath) {
  return inspectFile(filePath, 5);
}

function resolveTempFile(fileName) {
  const safeName = path.basename(fileName || '');
  const uploadRoot = path.isAbsolute(env.uploadDir) ? env.uploadDir : path.join(process.cwd(), env.uploadDir);
  const filePath = path.join(uploadRoot, safeName);
  return filePath;
}

module.exports = {
  importUploadedFile,
  previewFile,
  resolveTempFile,
  inspectUploadedFile
};
