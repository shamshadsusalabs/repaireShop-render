const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const mechanicController = require('../controllers/mechanicController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All mechanic CRUD routes are protected
router.use(protect);

// ─── Get All Mechanics (Admin + Manager) ─────────────────────
router.get('/', authorize('admin', 'manager'), mechanicController.getAllMechanics);

// ─── Get Single Mechanic (Admin + Manager) ───────────────────
router.get('/:id', authorize('admin', 'manager'), mechanicController.getMechanicById);

// ─── Create Mechanic (Admin Only) ────────────────────────────
router.post(
    '/',
    authorize('admin'),
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters'),
        body('experience').trim().notEmpty().withMessage('Experience is required'),
        body('specialty').trim().notEmpty().withMessage('Specialty is required'),
    ],
    validate,
    mechanicController.createMechanic
);

// ─── Update Mechanic (Admin Only) ────────────────────────────
router.put('/:id', authorize('admin'), mechanicController.updateMechanic);

// ─── Delete Mechanic (Admin Only) ────────────────────────────
router.delete('/:id', authorize('admin'), mechanicController.deleteMechanic);

module.exports = router;
