const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate Access Token (short-lived)
 * @param {string} id - User/Mechanic ID
 * @param {string} role - 'admin' | 'receptionist' | 'mechanic'
 * @returns {string} JWT access token
 */
const generateAccessToken = (id, role) => {
    return jwt.sign({ id, role }, config.jwtSecret, {
        expiresIn: config.jwtExpire, // 15m
    });
};

/**
 * Generate Refresh Token (long-lived)
 * @param {string} id - User/Mechanic ID
 * @param {string} role - 'admin' | 'receptionist' | 'mechanic'
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (id, role) => {
    return jwt.sign({ id, role }, config.refreshTokenSecret, {
        expiresIn: config.refreshTokenExpire, // 7d
    });
};

/**
 * Verify Refresh Token
 * @param {string} token - Refresh token string
 * @returns {object} decoded payload { id, role }
 */
const verifyRefreshToken = (token) => {
    return jwt.verify(token, config.refreshTokenSecret);
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
};
