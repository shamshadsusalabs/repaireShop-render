const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const controller = require('../controllers/notificationSettingsController');

// All routes require admin or manager
router.use(protect, authorize('admin', 'manager'));

router.get('/', controller.getAll);
router.get('/:key', controller.getByKey);
router.put('/', controller.upsert);

module.exports = router;
