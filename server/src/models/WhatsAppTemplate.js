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
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('WhatsAppTemplate', whatsAppTemplateSchema);
