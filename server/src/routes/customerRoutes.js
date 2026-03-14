const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get all customers (with search & pagination)
router.get('/', authorize('admin', 'manager', 'receptionist'), customerController.getAllCustomers);

// Get customer by mobile number
router.get('/mobile/:mobile', customerController.getCustomerByMobile);

// Get customer vehicle history
router.get('/vehicle-history/:mobile/:carNumber', customerController.getVehicleHistory);

// Get customer by customer ID
router.get('/:customerId', customerController.getCustomerById);

// Update customer
router.put('/:customerId', authorize('admin', 'manager', 'receptionist'), customerController.updateCustomer);

module.exports = router;
