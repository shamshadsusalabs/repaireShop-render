const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const jobController = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// All job routes are protected
router.use(protect);

// ─── Dashboard Stats ─────────────────────────────────────────
router.get('/stats', jobController.getDashboardStats);

// ─── Job History Check (Auto-fill) ───────────────────────────
router.get('/history', jobController.getJobHistory);

// ─── Store: Get Approved Jobs Needing Parts ──────────────────
router.get('/approved-for-parts', authorize('store', 'admin'), jobController.getApprovedJobs);

// ─── Receptionist/Admin/Manager: Get All Active Drivers ──────
router.get('/drivers', authorize('receptionist', 'admin', 'manager'), jobController.getDrivers);

// ─── Create Job ──────────────────────────────────────────────
router.post(
    '/',
    upload.array('carImages', 10),
    [
        body('customerName').trim().notEmpty().withMessage('Customer name is required'),
        body('mobile')
            .matches(/^[6-9]\d{9}$/)
            .withMessage('Enter a valid 10-digit Indian mobile number'),
        body('carModel').trim().notEmpty().withMessage('Car model is required'),
        body('carNumber').trim().notEmpty().withMessage('Car number is required'),
        body('kmDriven')
            .isNumeric()
            .withMessage('KM driven must be a number')
            .custom((val) => val >= 0 && val <= 999999)
            .withMessage('KM driven must be between 0 and 999999'),
    ],
    validate,
    jobController.createJob
);

// ─── Get All Jobs ────────────────────────────────────────────
router.get('/', jobController.getAllJobs);

// ─── Get Single Job ──────────────────────────────────────────
router.get('/:jobId', jobController.getJobById);

// ─── Update Job ──────────────────────────────────────────────
router.put('/:jobId', upload.array('carImages', 10), jobController.updateJob);

// ─── Assign Mechanic ─────────────────────────────────────────
router.put(
    '/:jobId/assign',
    [body('mechanicId').notEmpty().withMessage('Mechanic ID is required')],
    validate,
    jobController.assignMechanic
);

// ─── Assign Driver (Pickup/Drop) ─────────────────────────────
router.put(
    '/:jobId/assign-driver',
    authorize('receptionist', 'admin', 'manager'),
    [
        body('driverId').notEmpty().withMessage('Driver ID is required'),
        body('driverTask').isIn(['Pickup', 'Drop']).withMessage('Driver task must be Pickup or Drop'),
    ],
    validate,
    jobController.assignDriver
);

// ─── Save Inspection Results ─────────────────────────────────
router.put(
    '/:jobId/inspection',
    [
        body('inspectionResults')
            .isArray({ min: 1 })
            .withMessage('Inspection results are required'),
    ],
    validate,
    jobController.saveInspection
);

// ─── Save Faulty Parts ──────────────────────────────────────
router.put(
    '/:jobId/faults',
    [
        body('faultyParts')
            .isArray({ min: 1 })
            .withMessage('At least one faulty part is required'),
    ],
    validate,
    jobController.saveFaultyParts
);

// ─── Customer Approval ───────────────────────────────────────
router.put(
    '/:jobId/approval',
    [body('approved').isBoolean().withMessage('Approval status is required (true/false)')],
    validate,
    jobController.customerApproval
);

// ─── Save Repair Costs ──────────────────────────────────────
router.put(
    '/:jobId/repair-cost',
    [
        body('faultyParts')
            .isArray({ min: 1 })
            .withMessage('Faulty parts with costs are required'),
    ],
    validate,
    jobController.saveRepairCost
);

// ─── Complete Job ────────────────────────────────────────────
router.put('/:jobId/complete', jobController.completeJob);

// ─── Store: Issue Parts From Inventory ───────────────────────
router.put('/:jobId/issue-parts', authorize('store', 'admin'), jobController.issueParts);

// ─── Store: Mark Ready for Repair ────────────────────────────
router.put('/:jobId/ready-for-repair', authorize('store', 'admin'), jobController.markReadyForRepair);


// ─── Delete Job (Admin Only) ─────────────────────────────────
router.delete('/:jobId', authorize('admin'), jobController.deleteJob);

module.exports = router;
