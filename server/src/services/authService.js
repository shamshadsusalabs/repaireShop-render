const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');

/**
 * Register a new user (admin/receptionist)
 */
const registerUser = async ({ name, email, password, role }) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        const error = new Error('User with this email already exists');
        error.statusCode = 400;
        throw error;
    }

    const user = await User.create({ name, email, password, role });

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    // Save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
        },
        accessToken,
        refreshToken,
    };
};

/**
 * Login user (admin/receptionist)
 */
const loginUser = async ({ email, password, role }) => {
    const user = await User.findOne({ email }).select('+password +refreshToken');

    if (!user) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    if (!user.isActive) {
        const error = new Error('Account is deactivated. Contact administrator.');
        error.statusCode = 401;
        throw error;
    }

    // Validate role — user must login with their correct role
    if (role && user.role !== role) {
        const error = new Error(`You are not registered as ${role}. Your role is "${user.role}".`);
        error.statusCode = 403;
        throw error;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
        },
        accessToken,
        refreshToken,
    };
};

/**
 * Refresh tokens for admin/receptionist
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

    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    if (user.refreshToken !== oldRefreshToken) {
        user.refreshToken = null;
        await user.save({ validateBeforeSave: false });
        const error = new Error('Refresh token has been revoked. Please login again.');
        error.statusCode = 401;
        throw error;
    }

    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id, user.role);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
};

/**
 * Logout admin/receptionist
 */
const logout = async (userId) => {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
};

/**
 * Get admin/receptionist profile
 */
const getProfile = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    return user;
};

module.exports = {
    registerUser,
    loginUser,
    refreshTokens,
    logout,
    getProfile,
};
