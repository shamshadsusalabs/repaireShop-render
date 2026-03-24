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

// ── Campaigns ──────────────────────────────────────────────────────────

exports.sendCampaign = async (req, res) => {
    try {
        const { recipients, templateVars } = req.body;

        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ success: false, error: 'Invalid request payload: recipients required' });
        }

        const secretKey = process.env.whatApp_Secret;
        if (!secretKey) {
            return res.status(500).json({ success: false, error: 'whatApp_Secret is not configured in .env' });
        }

        // Extract driver details from the selected template's stored fields
        const driverName    = (templateVars?.driverName    || '').trim();
        const driverNumber  = (templateVars?.driverNumber  || '').trim();
        const companyName   = (templateVars?.companyName   || 'Luxure').trim();
        const contactNumber = (templateVars?.contactNumber || '9217099701').trim();

        let sent = 0;
        let failed = 0;

        for (const recipient of recipients) {
            try {
                let phone = recipient.phone.replace(/[\s\+]/g, '');
                let countryCode = "+91";
                if (phone.length > 10 && phone.startsWith('91')) {
                    phone = phone.substring(2);
                }

                // Interakt approved template "pickup":
                // {{1}} = customer name  (dynamic per recipient)
                // {{2}} = driver name    (from selected DB template)
                // {{3}} = driver number  (from selected DB template)
                // {{4}} = company name   (from selected DB template)
                // {{5}} = contact number (from selected DB template)
                const customerName = (recipient.name || 'Customer').trim();

                const payload = {
                    countryCode,
                    phoneNumber: phone,
                    type: "Template",
                    template: {
                        name: "pickup",
                        languageCode: "en",
                        bodyValues: [
                            customerName,   // {{1}}
                            driverName,     // {{2}}
                            driverNumber,   // {{3}}
                            companyName,    // {{4}}
                            contactNumber,  // {{5}}
                        ]
                    }
                };

                console.log(`\n\n=== 🚀 SENDING TO INTERAKT FOR PHONE: ${phone} ===`);
                console.log("Payload:", JSON.stringify(payload, null, 2));

                const response = await fetch('https://api.interakt.ai/v1/public/message/', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${secretKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.log(`❌ Interakt API HTTP Error: ${response.status}`, errorText);
                    throw new Error(`Interakt API Error: ${response.status} ${errorText}`);
                }

                const responseData = await response.json();
                console.log(`✅ Interakt API Success Response:`, JSON.stringify(responseData, null, 2));

                sent++;
            } catch (err) {
                console.error('Failed to send WhatsApp message to', recipient.phone, err.message);
                failed++;
            }
        }

        res.status(200).json({
            success: true,
            job: {
                id: "interakt-campaign-" + Date.now(),
                status: 'completed',
                total: recipients.length,
                processed: recipients.length,
                sent,
                failed
            }
        });

    } catch (error) {
        console.error('sendCampaign Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};


