const express = require('express');
const authRoutes = require('./authRoutes');
const mechanicAuthRoutes = require('./mechanicAuthRoutes');
const jobRoutes = require('./jobRoutes');
const mechanicRoutes = require('./mechanicRoutes');
const userRoutes = require('./userRoutes');
const publicRoutes = require('./publicRoutes');
const partRoutes = require('./partRoutes');
const vendorRoutes = require('./vendorRoutes');
const vendorAuthRoutes = require('./vendorAuthRoutes');
const storeOrderRoutes = require('./storeOrderRoutes');
const inspectionItemRoutes = require('./inspectionItemRoutes');
const carModelRoutes = require('./carModelRoutes');

const whatsAppRoutes = require('./whatsAppRoutes');

const router = express.Router();

// ─── API Root ────────────────────────────────────────────────
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🔧 SusaLabs Repairing Shop API is running',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            mechanicAuth: '/api/mechanic-auth',
            jobs: '/api/jobs',
            mechanics: '/api/mechanics',
            users: '/api/users',
            parts: '/api/parts',
            vendor: '/api/vendor',
            vendorAuth: '/api/vendor-auth',
            storeOrders: '/api/store/orders',
            whatsApp: '/api/whatsapp',
        },
    });
});

// ─── Health Check (Cloud Run probe) ─────────────────────────
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// ─── Mount Routes ────────────────────────────────────────────
router.use('/auth', authRoutes);                   // Admin/Receptionist auth
router.use('/mechanic-auth', mechanicAuthRoutes);  // Mechanic auth (login, logout, refresh)
router.use('/jobs', jobRoutes);                    // Job management (admin only via protect)
router.use('/mechanics', mechanicRoutes);          // Mechanic CRUD (admin only)
router.use('/users', userRoutes);                  // User CRUD (admin only)
router.use('/customers', require('./customerRoutes')); // Customer management
router.use('/public', publicRoutes);               // Public endpoints (no auth)
router.use('/parts', partRoutes);                  // Parts/Inventory (store & admin)
router.use('/vendor', vendorRoutes);               // Vendor endpoints
router.use('/vendor-auth', vendorAuthRoutes);       // Vendor auth (register, login, refresh, logout)
router.use('/store', storeOrderRoutes);            // Store orders for vendor parts
router.use('/inspection-items', inspectionItemRoutes); // Dynamic inspection checklist
router.use('/car-models', carModelRoutes);         // Dynamic car models
router.use('/whatsapp', whatsAppRoutes);           // WhatsApp groups and templates
router.use('/notification-settings', require('./notificationSettings')); // Auto notification config

module.exports = router;
