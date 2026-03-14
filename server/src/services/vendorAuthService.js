const Vendor = require('../models/Vendor');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');

/**
 * Register a new vendor
 */
const registerVendor = async ({ name, email, password, phone, gstNumber, companyName, address }) => {
    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) {
        const error = new Error('Vendor with this email already exists');
        error.statusCode = 400;
        throw error;
    }

    const vendor = await Vendor.create({ name, email, password, phone, gstNumber, companyName, address });

    const accessToken = generateAccessToken(vendor._id, 'vendor');
    const refreshToken = generateRefreshToken(vendor._id, 'vendor');

    vendor.refreshToken = refreshToken;
    await vendor.save();

    return {
        user: {
            id: vendor._id,
            name: vendor.name,
            email: vendor.email,
            phone: vendor.phone,
            gstNumber: vendor.gstNumber,
            companyName: vendor.companyName,
            address: vendor.address,
            role: vendor.role,
            avatar: vendor.avatar,
        },
        accessToken,
        refreshToken,
    };
};

/**
 * Login vendor
 */
const loginVendor = async ({ email, password }) => {
    const vendor = await Vendor.findOne({ email }).select('+password +refreshToken');

    if (!vendor) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    if (!vendor.isActive) {
        const error = new Error('Account is deactivated. Contact administrator.');
        error.statusCode = 401;
        throw error;
    }

    const isMatch = await vendor.comparePassword(password);
    if (!isMatch) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    const accessToken = generateAccessToken(vendor._id, 'vendor');
    const refreshToken = generateRefreshToken(vendor._id, 'vendor');

    vendor.refreshToken = refreshToken;
    await vendor.save();

    return {
        user: {
            id: vendor._id,
            name: vendor.name,
            email: vendor.email,
            phone: vendor.phone,
            gstNumber: vendor.gstNumber,
            companyName: vendor.companyName,
            address: vendor.address,
            role: vendor.role,
            avatar: vendor.avatar,
        },
        accessToken,
        refreshToken,
    };
};

/**
 * Refresh tokens for vendor
 */
const refreshTokens = async (oldRefreshToken) => {
    if (!oldRefreshToken) {
        const error = new Error('Refresh token is required');
        error.statusCode = 400;
        throw error;
    }

    let decoded;
    try {
        decoded = verifyRefreshToken(oldRefreshToken);
    } catch (err) {
        const error = new Error('Invalid or expired refresh token');
        error.statusCode = 401;
        throw error;
    }

    const vendor = await Vendor.findById(decoded.id).select('+refreshToken');

    if (!vendor) {
        const error = new Error('Vendor not found');
        error.statusCode = 404;
        throw error;
    }

    if (vendor.refreshToken !== oldRefreshToken) {
        vendor.refreshToken = null;
        await vendor.save();
        const error = new Error('Refresh token has been revoked. Please login again.');
        error.statusCode = 401;
        throw error;
    }

    const newAccessToken = generateAccessToken(vendor._id, 'vendor');
    const newRefreshToken = generateRefreshToken(vendor._id, 'vendor');

    vendor.refreshToken = newRefreshToken;
    await vendor.save();

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
};

/**
 * Logout vendor
 */
const logout = async (vendorId) => {
    await Vendor.findByIdAndUpdate(vendorId, { refreshToken: null });
};

/**
 * Get vendor profile
 */
const getProfile = async (vendorId) => {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
        const error = new Error('Vendor not found');
        error.statusCode = 404;
        throw error;
    }
    return vendor;
};

module.exports = {
    registerVendor,
    loginVendor,
    refreshTokens,
    logout,
    getProfile,
};
