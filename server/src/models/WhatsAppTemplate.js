const mongoose = require('mongoose');

const whatsAppTemplateSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Template title is required'],
            trim: true
        },
        body: {
            type: String,
            required: [true, 'Template body is required'],
            trim: true
        },
        // Interakt template variable values (stored per template)
        driverName: { type: String, trim: true, default: '' },
        driverNumber: { type: String, trim: true, default: '' },
        companyName: { type: String, trim: true, default: 'Luxure' },
        contactNumber: { type: String, trim: true, default: '9217099701' },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('WhatsAppTemplate', whatsAppTemplateSchema);
