const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const importService = require('../services/importService');
const cycleService = require('../services/cycleService');
const healthService = require('../services/healthService');

const showUploadPage = asyncHandler(async (req, res) => {
  const [stats, validationTrend, uploadTrend] = await Promise.all([
    cycleService.getDashboardStats(),
    cycleService.getValidationTrend(7),
    cycleService.getUploadTrend(6)
  ]);

  res.render('upload', {
    title: 'Serial Upload',
    uploadResult: null,
    error: null,
    stats,
    validationTrend,
    uploadTrend
  });
});

const previewUpload = asyncHandler(async (req, res) => {
  if (!req.file) {
    const [stats, validationTrend, uploadTrend] = await Promise.all([
      cycleService.getDashboardStats(),
      cycleService.getValidationTrend(7),
      cycleService.getUploadTrend(6)
    ]);

    return res.status(400).render('upload', {
      title: 'Serial Upload',
      uploadResult: null,
      error: 'Please upload a valid Excel or CSV file.',
      stats,
      validationTrend,
      uploadTrend
    });
  }

  const previewRows = importService.previewFile(req.file.path, 10);
  const debugInfo = previewRows.length ? null : importService.inspectUploadedFile(req.file.path);

  res.render('preview', {
    title: 'Preview Upload',
    tempFileName: path.basename(req.file.path),
    originalFileName: req.file.originalname,
    previewRows,
    totalPreviewRows: previewRows.length,
    error: null,
    debugInfo
  });
});

const importUpload = asyncHandler(async (req, res) => {
  const tempFileName = String(req.body.tempFileName || '');
  if (!tempFileName) {
    return res.status(400).render('upload', {
      title: 'Serial Upload',
      uploadResult: null,
      error: 'Preview file is missing. Please upload the file again.'
    });
  }

  const filePath = importService.resolveTempFile(tempFileName);
  const summary = await importService.importUploadedFile(filePath, req.body.originalFileName || tempFileName);

  const [stats, validationTrend, uploadTrend] = await Promise.all([
    cycleService.getDashboardStats(),
    cycleService.getValidationTrend(7),
    cycleService.getUploadTrend(6)
  ]);

  res.render('upload', {
    title: 'Serial Upload',
    uploadResult: summary,
    error: null,
    stats,
    validationTrend,
    uploadTrend
  });
});

const listRecords = asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim();
  const status = String(req.query.status || 'all').trim();
  const records = await cycleService.listCycles({ search, status });

  res.render('records', {
    title: 'Records',
    records,
    search,
    status
  });
});

const listLogs = asyncHandler(async (req, res) => {
  const logs = await cycleService.listUploadLogs();

  res.render('logs', {
    title: 'Upload Logs',
    logs
  });
});

const showHealthPage = asyncHandler(async (req, res) => {
  const health = await healthService.checkHealth();

  res.render('health', {
    title: 'Health',
    health
  });
});

const updateRecordStatus = asyncHandler(async (req, res) => {
  const id = Number(req.body.id);
  const isValidated = String(req.body.isValidated) === 'true';

  if (!id) {
    return res.status(400).json({ ok: false, message: 'Record id is required.' });
  }

  const updated = await cycleService.updateValidationStatus(id, isValidated);

  if (!updated) {
    return res.status(404).json({ ok: false, message: 'Record not found.' });
  }

  return res.json({
    ok: true,
    record: {
      id: updated.id,
      is_validated: updated.is_validated,
      validated_at: updated.validated_at
    }
  });
});

const deleteRecord = asyncHandler(async (req, res) => {
  const id = Number(req.body.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: 'Record id is required.' });
  }

  const deleted = await cycleService.deleteCyclesByIds([id]);
  return res.json({ ok: true, deleted });
});

const bulkDeleteRecords = asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map((value) => Number(value)).filter(Boolean) : [];

  const deleted = await cycleService.deleteCyclesByIds(ids);
  return res.json({ ok: true, deleted });
});

const resetAllData = asyncHandler(async (req, res) => {
  await cycleService.clearAllData();
  return res.json({ ok: true });
});

module.exports = {
  showUploadPage,
  previewUpload,
  importUpload,
  listRecords,
  listLogs,
  showHealthPage,
  updateRecordStatus,
  deleteRecord,
  bulkDeleteRecords,
  resetAllData
};
