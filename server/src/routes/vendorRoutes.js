const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authorize, protect } = require('../middleware/auth');
const vendorController = require('../controllers/vendorController');

const router = express.Router();

// All routes require authentication and vendor role
router.use(protect);
router.use(authorize('vendor'));

// Orders — read-only + status update
router.route('/orders')
    .get(vendorController.getVendorOrders);

router.route('/orders/:id')
    .get(vendorController.getVendorOrderById);


module.exports = router;
