const mechanicAuthService = require('../services/mechanicAuthService');

/**
 * @desc    Login mechanic
 * @route   POST /api/mechanic-auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await mechanicAuthService.loginMechanic({ email, password });

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
 * @desc    Refresh mechanic tokens
 * @route   POST /api/mechanic-auth/refresh-token
 * @access  Public
 */
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const result = await mechanicAuthService.refreshTokens(refreshToken);

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
 * @desc    Logout mechanic
 * @route   POST /api/mechanic-auth/logout
 * @access  Private (mechanic)
 */
const logout = async (req, res, next) => {
    try {
        await mechanicAuthService.logout(req.user._id);

        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get mechanic profile
 * @route   GET /api/mechanic-auth/me
 * @access  Private (mechanic)
 */
const getMe = async (req, res, next) => {
    try {
        const mechanic = await mechanicAuthService.getProfile(req.user._id);

        res.status(200).json({
            success: true,
            data: mechanic,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    refreshToken,
    logout,
    getMe,
};
