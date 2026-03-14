const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
    {
        customerId: {
            type: String,
            required: false, // Will be auto-generated
            unique: true,
            trim: true,
            sparse: true, // Allow null/undefined temporarily
        },
        name: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true,
        },
        mobile: {
            type: String,
            required: [true, 'Mobile number is required'],
            unique: true,
            trim: true,
        },
        carModel: {
            type: String,
            default: '',
        },
        carNumber: {
            type: String,
            default: '',
            uppercase: true,
        },
        // Simple KM history array
        kmHistory: [
            {
                km: {
                    type: Number,
                    required: true,
                },
                date: {
                    type: Date,
                    default: Date.now,
                },
                jobId: {
                    type: String,
                    default: '',
                },
            },
        ],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster searches
customerSchema.index({ mobile: 1 });
customerSchema.index({ customerId: 1 });

// Generate unique customer ID before saving (only for new documents)
customerSchema.pre('save', async function (next) {
    if (this.isNew && !this.customerId) {
        try {
            // Generate ID: CUST-YYYY-XXXX (e.g., CUST-2024-0001)
            const year = new Date().getFullYear();
            const Customer = mongoose.model('Customer');
            const count = await Customer.countDocuments();
            const sequence = String(count + 1).padStart(4, '0');
            this.customerId = `CUST-${year}-${sequence}`;
        } catch (error) {
            console.error('Error generating customer ID:', error);
        }
    }
    next();
});

module.exports = mongoose.model('Customer', customerSchema);

