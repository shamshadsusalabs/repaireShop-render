const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Mechanic = require('../models/Mechanic');
const Vendor = require('../models/Vendor');
const config = require('../config');

// Protect routes - verify JWT access token
const protect = async (req, res, next) => {
    let token;

    // Check for Bearer token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized - No token provided',
        });
    }

    try {
        // Verify access token
        const decoded = jwt.verify(token, config.jwtSecret);

        const { id, role } = decoded;

        // Find user based on role
        if (role === 'mechanic') {
            req.user = await Mechanic.findById(id);
        } else if (role === 'vendor') {
            req.user = await Vendor.findById(id);
        } else {
            req.user = await User.findById(id).select('-password');
        }

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized - User not found',
            });
        }

        // Check isActive for User and Vendor models (Mechanic uses 'available' but we don't block on it)
        if (role !== 'mechanic' && req.user.isActive === false) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated',
            });
        }

        // Attach role to req.user for downstream use
        if (!req.user.role) {
            req.user.role = role;
        }

        next();
    } catch (error) {
        // Differentiate between expired and invalid tokens
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Access token expired',
                code: 'TOKEN_EXPIRED',
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Not authorized - Invalid token',
        });
    }
};

// Authorize specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not authorized to access this resource`,
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
