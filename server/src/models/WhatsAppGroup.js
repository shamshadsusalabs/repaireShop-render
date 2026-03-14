const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    mobile: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['mechanic', 'driver', 'manager', 'receptionist'],
        default: 'mechanic'
    }
});

const whatsAppGroupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Group name is required'],
            trim: true
        },
        members: [memberSchema]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('WhatsAppGroup', whatsAppGroupSchema);
