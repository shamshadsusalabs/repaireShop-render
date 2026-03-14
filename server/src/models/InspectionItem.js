const mongoose = require('mongoose');

const inspectionItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Inspection item name is required'],
            trim: true,
            unique: true,
        },
        icon: {
            type: String,
            default: '🔧',
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Include virtuals in JSON
inspectionItemSchema.set('toJSON', { virtuals: true });
inspectionItemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('InspectionItem', inspectionItemSchema);
