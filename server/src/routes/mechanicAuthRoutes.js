const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const mechanicAuthController = require('../controllers/mechanicAuthController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── Mechanic Login ──────────────────────────────────────────
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    validate,
    mechanicAuthController.login
);

// ─── Mechanic Refresh Token ─────────────────────────────────
router.post(
    '/refresh-token',
    [
        body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    ],
    validate,
    mechanicAuthController.refreshToken
);

// ─── Mechanic Logout ─────────────────────────────────────────
router.post('/logout', protect, mechanicAuthController.logout);

// ─── Mechanic Profile ────────────────────────────────────────
router.get('/me', protect, mechanicAuthController.getMe);

module.exports = router;
