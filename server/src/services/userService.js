const User = require('../models/User');

/**
 * Get all users (excluding password and refreshToken)
 */
const getAllUsers = async (query = {}) => {
    const filter = {};

    // Filter by role
    if (query.role) {
        filter.role = query.role;
    }

    // Search by name or email
    if (query.search) {
        filter.$or = [
            { name: { $regex: query.search, $options: 'i' } },
            { email: { $regex: query.search, $options: 'i' } },
        ];
    }

    // Filter by active status
    if (query.isActive !== undefined) {
        filter.isActive = query.isActive === 'true';
    }

    const users = await User.find(filter).sort('-createdAt');
    return users;
};

/**
 * Get a single user by ID
 */
const getUserById = async (id) => {
    const user = await User.findById(id);
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    return user;
};

/**
 * Create a new user
 */
const createUser = async (userData) => {
    // Check if email already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
        const error = new Error('User with this email already exists');
        error.statusCode = 400;
        throw error;
    }

    const user = await User.create(userData);

    // Don't return password
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    return userObj;
};

/**
 * Update a user
 */
const updateUser = async (id, updates) => {
    // If updating password, use save() for pre-save hash hook
    if (updates.password) {
        const user = await User.findById(id).select('+password');
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        Object.assign(user, updates);
        await user.save({ validateBeforeSave: false });

        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.refreshToken;
        return userObj;
    }

    const user = await User.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
    });

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return user;
};

/**
 * Delete a user
 */
const deleteUser = async (id) => {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    return user;
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};
