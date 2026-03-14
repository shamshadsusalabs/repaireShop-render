const mongoose = require('mongoose');

// ─── Inspection Result Sub-Schema ────────────────────────────
const inspectionResultSchema = new mongoose.Schema(
    {
        partName: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ['OK', 'Not OK', 'Pending'],
            default: 'Pending',
        },
        comment: {
            type: String,
            default: '',
            trim: true,
        },
    },
    { _id: false }
);

// ─── Faulty Part Sub-Schema ──────────────────────────────────
const faultyPartSchema = new mongoose.Schema(
    {
        partName: {
            type: String,
            required: true,
            trim: true,
        },
        issueDescription: {
            type: String,
            required: true,
            trim: true,
        },
        estimatedCost: {
            type: Number,
            default: 0,
            min: 0,
        },
        actualCost: {
            type: Number,
            default: 0,
            min: 0,
        },
        labourCharge: {
            type: Number,
            default: 0,
            min: 0,
        },
        discount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    { _id: false }
);

// ─── Issued Part Sub-Schema (Store → Job) ────────────────────
const issuedPartSchema = new mongoose.Schema(
    {
        partId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Part',
            default: null,
        },
        partName: {
            type: String,
            required: true,
            trim: true,
        },
        partNumber: {
            type: String,
            default: '',
            trim: true,
        },
        quantityIssued: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },
        unitPrice: {
            type: Number,
            default: 0,
            min: 0,
        },
        issuedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        issuedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

// ─── Main Job Schema ─────────────────────────────────────────
const jobSchema = new mongoose.Schema(
    {
        jobId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        customerName: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true,
            maxlength: [150, 'Customer name cannot exceed 150 characters'],
        },
        mobile: {
            type: String,
            required: [true, 'Mobile number is required'],
            match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
        },
        carModel: {
            type: String,
            required: [true, 'Car model is required'],
            trim: true,
        },
        carNumber: {
            type: String,
            required: [true, 'Car number is required'],
            uppercase: true,
            trim: true,
        },
        kmDriven: {
            type: Number,
            required: [true, 'Kilometer reading is required'],
            min: [0, 'KM driven cannot be negative'],
            max: [999999, 'KM driven seems too high'],
        },
        carImages: {
            type: [String],
            default: [],
        },
        jobType: {
            type: String,
            enum: ['Pickup', 'Walk-in'],
            default: 'Walk-in',
        },
        location: {
            type: String,
            default: '',
            trim: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ['Pending', 'Assigned', 'Inspection', 'Approval', 'Approved', 'Rejected', 'Parts Requested', 'Repairing', 'Completed'],
            default: 'Pending',
        },
        mechanicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Mechanic',
            default: null,
        },
        driverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        driverTask: {
            type: String,
            enum: ['Pickup', 'Drop', null],
            default: null,
        },
        inspectionResults: [inspectionResultSchema],
        faultyParts: [faultyPartSchema],
        partsIssued: [issuedPartSchema],
        approved: {
            type: Boolean,
            default: null,
        },
        gstPercent: {
            type: Number,
            default: 18,
            min: 0,
            max: 100,
        },
        grandTotal: {
            type: Number,
            default: 0,
            min: 0,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Auto-calculate grandTotal before saving
jobSchema.pre('save', function (next) {
    if (this.faultyParts && this.faultyParts.length > 0) {
        const subtotal = this.faultyParts.reduce((sum, part) => {
            return sum + part.actualCost + part.labourCharge - part.discount;
        }, 0);
        const gstAmount = (subtotal * this.gstPercent) / 100;
        this.grandTotal = Math.round(subtotal + gstAmount);
    }
    next();
});

// Virtual for formatted date
jobSchema.virtual('formattedDate').get(function () {
    return this.date ? this.date.toISOString().slice(0, 16).replace('T', ' ') : '';
});

// Include virtuals in JSON
jobSchema.set('toJSON', { virtuals: true });
jobSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Job', jobSchema);
