const express = require('express');
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const auditController = require('../controllers/auditController');
const upload = require('../middleware/upload');
const { requireAuth, requireRole } = require('../middleware/authSession');
const { ROLE_CODES } = require('../services/userService');

const router = express.Router();

router.get('/', requireAuth, adminController.showUploadPage);
router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/change-password', requireAuth, authController.changePassword);

router.use(requireAuth);
router.post('/upload/preview', requireRole([ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.OPS_ADMIN]), upload.single('file'), adminController.previewUpload);
router.post('/upload/import', requireRole([ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.OPS_ADMIN]), express.urlencoded({ extended: true }), adminController.importUpload);
router.get('/records', adminController.listRecords);
router.get('/logs', adminController.listLogs);
router.get('/health', adminController.showHealthPage);
router.get('/users', requireRole(ROLE_CODES.SYSTEM_ADMIN), userController.listUsers);
router.get('/audit-logs', requireRole(ROLE_CODES.SYSTEM_ADMIN), auditController.listAuditLogs);

router.post('/records/update-status', requireRole([ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.OPS_ADMIN]), express.json(), adminController.updateRecordStatus);
router.post('/records/delete', requireRole([ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.OPS_ADMIN]), express.json(), adminController.deleteRecord);
router.post('/records/bulk-delete', requireRole([ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.OPS_ADMIN]), express.json(), adminController.bulkDeleteRecords);
router.post('/records/reset', requireRole([ROLE_CODES.SYSTEM_ADMIN, ROLE_CODES.OPS_ADMIN]), express.json(), adminController.resetAllData);

router.post('/users/create', requireRole(ROLE_CODES.SYSTEM_ADMIN), express.urlencoded({ extended: true }), express.json(), userController.createUser);
router.post('/users/update-username', requireRole(ROLE_CODES.SYSTEM_ADMIN), express.json(), userController.updateUsername);
router.post('/users/update-role', requireRole(ROLE_CODES.SYSTEM_ADMIN), express.json(), userController.updateUserRole);
router.post('/users/toggle-active', requireRole(ROLE_CODES.SYSTEM_ADMIN), express.json(), userController.toggleUserActive);
router.post('/users/reset-password', requireRole(ROLE_CODES.SYSTEM_ADMIN), express.json(), userController.resetUserPassword);
router.post('/users/unlock', requireRole(ROLE_CODES.SYSTEM_ADMIN), express.json(), userController.unlockUser);
router.post('/users/delete', requireRole(ROLE_CODES.SYSTEM_ADMIN), express.json(), userController.deleteUser);

module.exports = router;
