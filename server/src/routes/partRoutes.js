const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const validate = require('../middleware/validate');
const partController = require('../controllers/partController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Multer config for Excel upload (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xlsx, .xls) and CSV files are allowed'), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// All part routes are protected - only store and admin can access
router.use(protect);
router.use(authorize('store', 'admin'));

// ─── Get Inventory Stats ─────────────────────────────────────
router.get('/stats', partController.getInventoryStats);

// ─── Download Excel Template ─────────────────────────────────
router.get('/template', partController.downloadTemplate);

// ─── Get All Parts ───────────────────────────────────────────
router.get('/', partController.getAllParts);

// ─── Get Single Part ─────────────────────────────────────────
router.get('/:id', partController.getPartById);

// ─── Create Part ─────────────────────────────────────────────
router.post(
    '/',
    [
        body('partName').trim().notEmpty().withMessage('Part name is required'),
        body('partNumber').trim().notEmpty().withMessage('Part number is required'),
        body('category').optional().isIn([
            'Engine', 'Brake', 'Suspension', 'Electrical', 'Body',
            'Transmission', 'AC & Cooling', 'Tyre & Wheel', 'Oil & Fluids',
            'Filter', 'Battery', 'Lights', 'Interior', 'Exhaust', 'Steering', 'Other',
        ]).withMessage('Invalid category'),
        body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive number'),
        body('costPrice').isFloat({ min: 0 }).withMessage('Cost price must be a positive number'),
        body('buyGstPercent').optional().isFloat({ min: 0, max: 100 }).withMessage('Buy GST must be 0-100'),
        body('sellPrice').isFloat({ min: 0 }).withMessage('Sell price must be a positive number'),
        body('sellGstPercent').optional().isFloat({ min: 0, max: 100 }).withMessage('Sell GST must be 0-100'),
    ],
    validate,
    partController.createPart
);

// ─── Upload Excel ────────────────────────────────────────────
router.post('/upload-excel', upload.single('file'), partController.uploadExcel);

// ─── Update Part ─────────────────────────────────────────────
router.put('/:id', partController.updatePart);

// ─── Delete Part ─────────────────────────────────────────────
router.delete('/:id', partController.deletePart);

module.exports = router;
