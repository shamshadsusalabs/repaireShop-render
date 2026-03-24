const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema(
    {
        templateKey: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        templateName: {
            type: String,
            required: true,
            trim: true,
        },
        companyName: {
            type: String,
            default: 'Luxure',
            trim: true,
        },
        contactNumber: {
            type: String,
            default: '9217099701',
            trim: true,
        },
        isEnabled: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('NotificationSettings', notificationSettingsSchema);
