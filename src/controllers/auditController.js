const asyncHandler = require('../utils/asyncHandler');
const auditService = require('../services/auditService');

const listAuditLogs = asyncHandler(async (req, res) => {
  const logs = await auditService.listAuditLogs();

  res.render('audit', {
    title: 'Audit Logs',
    logs
  });
});

module.exports = {
  listAuditLogs
};
