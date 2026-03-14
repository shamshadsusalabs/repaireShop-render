const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema(
    {
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Store ID is required'],
        },
        orderNumber: {
            type: String,
            unique: true,
        },
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            required: [true, 'Vendor ID is required'],
        },
        partName: {
            type: String,
            required: [true, 'Part name is required'],
            trim: true,
        },
        partNumber: {
            type: String,
            trim: true,
            default: '',
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [1, 'Quantity must be at least 1'],
        },
        unitPrice: {
            type: Number,
            required: [true, 'Unit price is required'],
            min: [0, 'Unit price cannot be negative'],
        },
        discount: {
            type: Number,
            default: 0,
            min: [0, 'Discount cannot be negative'],
            max: [100, 'Discount cannot exceed 100%'],
        },
        gstPercent: {
            type: Number,
            default: 18,
            min: [0, 'GST cannot be negative'],
            max: [100, 'GST cannot exceed 100%'],
        },
        totalCost: {
            type: Number,
            required: [true, 'Total cost is required'],
        },

        notes: {
            type: String,
            trim: true,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Generate unique order number before saving
purchaseOrderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        // Generate a random 8-character uppercase hex string as the order number
        const randomHex = Math.random().toString(16).substring(2, 10).toUpperCase();
        this.orderNumber = `PO-${randomHex}`;
        
        // Loop to ensure absolute uniqueness (rare case of collision)
        let isUnique = false;
        while (!isUnique) {
            const existingOrder = await mongoose.models.PurchaseOrder.findOne({ orderNumber: this.orderNumber });
            if (!existingOrder) {
                isUnique = true;
            } else {
                const newHex = Math.random().toString(16).substring(2, 10).toUpperCase();
                this.orderNumber = `PO-${newHex}`;
            }
        }
    }
    next();
});

purchaseOrderSchema.index({ storeId: 1 });
purchaseOrderSchema.index({ vendorId: 1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
