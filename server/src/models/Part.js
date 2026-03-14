const mongoose = require('mongoose');

const partSchema = new mongoose.Schema(
    {
        partName: {
            type: String,
            required: [true, 'Part name is required'],
            trim: true,
            maxlength: [200, 'Part name cannot exceed 200 characters'],
        },
        partNumber: {
            type: String,
            required: [true, 'Part number is required'],
            trim: true,
            unique: true,
            uppercase: true,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
            enum: [
                'Engine',
                'Brake',
                'Suspension',
                'Electrical',
                'Body',
                'Transmission',
                'AC & Cooling',
                'Tyre & Wheel',
                'Oil & Fluids',
                'Filter',
                'Battery',
                'Lights',
                'Interior',
                'Exhaust',
                'Steering',
                'Other',
            ],
            default: 'Other',
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [0, 'Quantity cannot be negative'],
            default: 0,
        },
        minStock: {
            type: Number,
            default: 5,
            min: [0, 'Minimum stock cannot be negative'],
        },
        costPrice: {
            type: Number,
            required: [true, 'Cost price is required'],
            min: [0, 'Cost price cannot be negative'],
        },
        buyGstPercent: {
            type: Number,
            default: 0,
            min: [0, 'Buy GST cannot be negative'],
            max: [100, 'Buy GST cannot exceed 100%'],
        },
        sellPrice: {
            type: Number,
            required: [true, 'Sell price is required'],
            min: [0, 'Sell price cannot be negative'],
        },
        sellGstPercent: {
            type: Number,
            default: 0,
            min: [0, 'Sell GST cannot be negative'],
            max: [100, 'Sell GST cannot exceed 100%'],
        },
        location: {
            type: String,
            trim: true,
            default: '',
        },
        supplier: {
            type: String,
            trim: true,
            default: '',
        },
        vehicleModel: {
            type: String,
            trim: true,
            default: '',
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster searches
partSchema.index({ partName: 'text', partNumber: 'text', category: 'text', vehicleModel: 'text' });
partSchema.index({ category: 1 });
partSchema.index({ quantity: 1 });

module.exports = mongoose.model('Part', partSchema);
