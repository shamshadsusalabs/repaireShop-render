const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All user routes are protected and admin only
router.use(protect);
router.use(authorize('admin'));

// ─── Get All Users ───────────────────────────────────────────
router.get('/', userController.getAllUsers);

// ─── Get Single User ─────────────────────────────────────────
router.get('/:id', userController.getUserById);

// ─── Create User ─────────────────────────────────────────────
router.post(
    '/',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters'),
        body('role')
            .isIn(['admin', 'manager', 'store', 'accountant', 'driver', 'receptionist', 'vendor'])
            .withMessage('Role must be admin, manager, store, accountant, driver, receptionist, or vendor'),
    ],
    validate,
    userController.createUser
);

// ─── Update User ─────────────────────────────────────────────
router.put('/:id', userController.updateUser);

// ─── Delete User ─────────────────────────────────────────────
router.delete('/:id', userController.deleteUser);

module.exports = router;
