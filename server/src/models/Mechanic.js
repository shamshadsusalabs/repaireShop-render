const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mechanicSchema = new mongoose.Schema(
    {
        mechanicId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            required: [true, 'Mechanic name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        experience: {
            type: String,
            required: [true, 'Experience is required'],
            trim: true,
        },
        specialty: {
            type: String,
            required: [true, 'Specialty is required'],
            trim: true,
        },
        avatar: {
            type: String,
            default: '🔧',
        },
        available: {
            type: Boolean,
            default: true,
        },
        mobile: {
            type: String,
            default: '',
        },
        role: {
            type: String,
            enum: ['mechanic'],
            default: 'mechanic',
        },
        refreshToken: {
            type: String,
            default: null,
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
mechanicSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare entered password with hashed password
mechanicSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Mechanic', mechanicSchema);
