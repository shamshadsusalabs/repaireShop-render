const vendorAuthService = require('../services/vendorAuthService');

/**
 * @desc    Register a new vendor
 * @route   POST /api/vendor-auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
    try {
        const { name, email, password, phone, gstNumber, companyName, address } = req.body;
        const result = await vendorAuthService.registerVendor({ name, email, password, phone, gstNumber, companyName, address });

        res.status(201).json({
            success: true,
            message: 'Vendor registered successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Login vendor
 * @route   POST /api/vendor-auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await vendorAuthService.loginVendor({ email, password });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Refresh vendor tokens
 * @route   POST /api/vendor-auth/refresh-token
 * @access  Public
 */
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const result = await vendorAuthService.refreshTokens(refreshToken);

        res.status(200).json({
            success: true,
            message: 'Tokens refreshed successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Logout vendor
 * @route   POST /api/vendor-auth/logout
 * @access  Private (vendor)
 */
const logout = async (req, res, next) => {
    try {
        await vendorAuthService.logout(req.user._id);

        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get vendor profile
 * @route   GET /api/vendor-auth/me
 * @access  Private (vendor)
 */
const getMe = async (req, res, next) => {
    try {
        const vendor = await vendorAuthService.getProfile(req.user._id);

        res.status(200).json({
            success: true,
            data: vendor,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    getMe,
};
