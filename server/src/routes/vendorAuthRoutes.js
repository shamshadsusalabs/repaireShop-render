const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const vendorAuthController = require('../controllers/vendorAuthController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── Vendor Register ─────────────────────────────────────────
router.post(
    '/register',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters'),
        body('phone').optional().trim(),
        body('gstNumber').optional().trim(),
        body('companyName').optional().trim(),
        body('address').optional().trim(),
    ],
    validate,
    vendorAuthController.register
);

// ─── Vendor Login ────────────────────────────────────────────
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    validate,
    vendorAuthController.login
);

// ─── Vendor Refresh Token ────────────────────────────────────
router.post(
    '/refresh-token',
    [
        body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    ],
    validate,
    vendorAuthController.refreshToken
);

// ─── Vendor Logout ───────────────────────────────────────────
router.post('/logout', protect, vendorAuthController.logout);

// ─── Vendor Profile ──────────────────────────────────────────
router.get('/me', protect, vendorAuthController.getMe);

module.exports = router;
