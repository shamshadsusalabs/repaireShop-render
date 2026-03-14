const WhatsAppGroup = require('../models/WhatsAppGroup');
const WhatsAppTemplate = require('../models/WhatsAppTemplate');

// ── Groups ─────────────────────────────────────────────────────────────

exports.getAllGroups = async (req, res) => {
    try {
        const groups = await WhatsAppGroup.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: groups });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.createGroup = async (req, res) => {
    try {
        const group = await WhatsAppGroup.create(req.body);
        res.status(201).json({ success: true, data: group });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.updateGroup = async (req, res) => {
    try {
        const group = await WhatsAppGroup.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
        res.status(200).json({ success: true, data: group });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.deleteGroup = async (req, res) => {
    try {
        const group = await WhatsAppGroup.findByIdAndDelete(req.params.id);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ── Templates ──────────────────────────────────────────────────────────

exports.getAllTemplates = async (req, res) => {
    try {
        const templates = await WhatsAppTemplate.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: templates });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.createTemplate = async (req, res) => {
    try {
        const template = await WhatsAppTemplate.create(req.body);
        res.status(201).json({ success: true, data: template });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.updateTemplate = async (req, res) => {
    try {
        const template = await WhatsAppTemplate.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
        res.status(200).json({ success: true, data: template });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.deleteTemplate = async (req, res) => {
    try {
        const template = await WhatsAppTemplate.findByIdAndDelete(req.params.id);
        if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
