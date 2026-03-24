const NotificationSettings = require('../models/NotificationSettings');

// Get all notification settings
exports.getAll = async (req, res) => {
    try {
        const settings = await NotificationSettings.find().sort('templateKey');
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get single setting by templateKey
exports.getByKey = async (req, res) => {
    try {
        const setting = await NotificationSettings.findOne({ templateKey: req.params.key });
        if (!setting) {
            return res.status(404).json({ success: false, error: 'Setting not found' });
        }
        res.status(200).json({ success: true, data: setting });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Create or update setting (upsert)
exports.upsert = async (req, res) => {
    try {
        const { templateKey, templateName, companyName, contactNumber, isEnabled } = req.body;

        const setting = await NotificationSettings.findOneAndUpdate(
            { templateKey },
            { templateKey, templateName, companyName, contactNumber, isEnabled },
            { upsert: true, new: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: setting });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
