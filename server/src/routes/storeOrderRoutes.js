const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authorize, protect } = require('../middleware/auth');
const storeOrderController = require('../controllers/storeOrderController');

const router = express.Router();

// Store and Admin routes
router.use(protect);
router.use(authorize('store', 'admin'));

// Vendors list (for dropdown in PO form)
router.get('/vendors', storeOrderController.getVendorsList);

// Purchase Orders
router
    .route('/orders')
    .post(
        [
            body('vendorId').trim().notEmpty().withMessage('Vendor is required'),
            body('partName').trim().notEmpty().withMessage('Part name is required'),
            body('partNumber').trim().notEmpty().withMessage('Part number is required'),
            body('unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
            body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
            body('gstPercent').optional().isFloat({ min: 0, max: 100 }).withMessage('GST must be 0-100'),
            body('discount').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be 0-100'),
        ],
        validate,
        storeOrderController.createOrder
    )
    .get(storeOrderController.getMyOrders);

router.route('/orders/:id')
    .get(storeOrderController.getStoreOrderById);

router.get('/orders/last-by-part/:partNumber', storeOrderController.getLatestOrderByPartNumber);

module.exports = router;
