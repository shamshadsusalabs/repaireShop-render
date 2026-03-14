const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── Register ────────────────────────────────────────────────
router.post(
    '/register',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters'),
        body('role')
            .optional()
            .isIn(['admin', 'mechanic', 'receptionist'])
            .withMessage('Invalid role'),
    ],
    validate,
    authController.register
);

// ─── Login ───────────────────────────────────────────────────
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    validate,
    authController.login
);

// ─── Refresh Token ───────────────────────────────────────────
router.post(
    '/refresh-token',
    [
        body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    ],
    validate,
    authController.refreshToken
);

// ─── Logout ──────────────────────────────────────────────────
router.post('/logout', protect, authController.logout);

// ─── Get Profile ─────────────────────────────────────────────
router.get('/me', protect, authController.getMe);

module.exports = router;
