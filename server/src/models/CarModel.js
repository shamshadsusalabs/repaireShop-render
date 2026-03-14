const mongoose = require('mongoose');

const carModelSchema = new mongoose.Schema(
    {
        brand: {
            type: String,
            required: [true, 'Car brand is required'],
            trim: true,
        },
        modelName: {
            type: String,
            required: [true, 'Car model name is required'],
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate brand-modelName pairs
carModelSchema.index({ brand: 1, modelName: 1 }, { unique: true });

// Include virtuals in JSON
carModelSchema.set('toJSON', { virtuals: true });
carModelSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CarModel', carModelSchema);
