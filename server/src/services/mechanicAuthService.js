const Mechanic = require('../models/Mechanic');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');

/**
 * Login mechanic
 */
const loginMechanic = async ({ email, password }) => {
    const mechanic = await Mechanic.findOne({ email }).select('+password +refreshToken');

    if (!mechanic) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    const isMatch = await mechanic.comparePassword(password);
    if (!isMatch) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    const accessToken = generateAccessToken(mechanic._id, mechanic.role);
    const refreshToken = generateRefreshToken(mechanic._id, mechanic.role);

    mechanic.refreshToken = refreshToken;
    await mechanic.save();

    return {
        user: {
            id: mechanic._id,
            mechanicId: mechanic.mechanicId,
            name: mechanic.name,
            email: mechanic.email,
            role: mechanic.role,
            specialty: mechanic.specialty,
            avatar: mechanic.avatar,
        },
        accessToken,
        refreshToken,
    };
};

/**
 * Refresh tokens for mechanic
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

    const mechanic = await Mechanic.findById(decoded.id).select('+refreshToken');

    if (!mechanic) {
        const error = new Error('Mechanic not found');
        error.statusCode = 404;
        throw error;
    }

    if (mechanic.refreshToken !== oldRefreshToken) {
        mechanic.refreshToken = null;
        await mechanic.save();
        const error = new Error('Refresh token has been revoked. Please login again.');
        error.statusCode = 401;
        throw error;
    }

    const newAccessToken = generateAccessToken(mechanic._id, mechanic.role);
    const newRefreshToken = generateRefreshToken(mechanic._id, mechanic.role);

    mechanic.refreshToken = newRefreshToken;
    await mechanic.save();

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
};

/**
 * Logout mechanic
 */
const logout = async (mechanicId) => {
    await Mechanic.findByIdAndUpdate(mechanicId, { refreshToken: null });
};

/**
 * Get mechanic profile
 */
const getProfile = async (mechanicId) => {
    const mechanic = await Mechanic.findById(mechanicId);
    if (!mechanic) {
        const error = new Error('Mechanic not found');
        error.statusCode = 404;
        throw error;
    }
    return mechanic;
};

module.exports = {
    loginMechanic,
    refreshTokens,
    logout,
    getProfile,
};
