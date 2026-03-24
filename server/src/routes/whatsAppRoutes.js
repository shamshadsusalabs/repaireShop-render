const express = require('express');
const router = express.Router();
const whatsAppController = require('../controllers/whatsAppController');
const { protect } = require('../middleware/auth');

// All WhatsApp routes are protected
router.use(protect);

// Groups
router.get('/groups', whatsAppController.getAllGroups);
router.post('/groups', whatsAppController.createGroup);
router.put('/groups/:id', whatsAppController.updateGroup);
router.delete('/groups/:id', whatsAppController.deleteGroup);

// Campaigns (Interakt API)
router.post('/send-campaign', whatsAppController.sendCampaign);

// Templates
router.get('/templates', whatsAppController.getAllTemplates);
router.post('/templates', whatsAppController.createTemplate);
router.put('/templates/:id', whatsAppController.updateTemplate);
router.delete('/templates/:id', whatsAppController.deleteTemplate);

module.exports = router;
