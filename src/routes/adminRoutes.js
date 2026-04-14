const express = require('express');
const adminController = require('../controllers/adminController');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', adminController.showUploadPage);
router.post('/upload/preview', upload.single('file'), adminController.previewUpload);
router.post('/upload/import', express.urlencoded({ extended: true }), adminController.importUpload);
router.get('/records', adminController.listRecords);
router.get('/logs', adminController.listLogs);
router.get('/health', adminController.showHealthPage);
router.post('/records/update-status', express.json(), adminController.updateRecordStatus);
router.post('/records/delete', express.json(), adminController.deleteRecord);
router.post('/records/bulk-delete', express.json(), adminController.bulkDeleteRecords);
router.post('/records/reset', express.json(), adminController.resetAllData);

module.exports = router;
