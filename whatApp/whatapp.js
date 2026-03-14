/*
  WhatsApp Code Reference Bundle
  --------------------------------
  Purpose:
  - Project ke WhatsApp-related code ko ek hi file me collect karke share karna.
  - Ye runtime import ke liye nahi hai. Ye reference/share file hai.

  Primary source files:
  - backend/services/whatsappService.js
  - backend/controllers/campaignController.js
  - backend/services/campaignAutomationService.js
  - backend/routes/campaignRoutes.js

  Notes:
  - Comments added so receiver ko flow clear rahe.
  - Existing project behavior me koi change nahi hota.
*/

/*
|--------------------------------------------------------------------------
| SECTION 1: Core WhatsApp Service
| Source: backend/services/whatsappService.js
|--------------------------------------------------------------------------
|
| Ye service:
| - whatsapp-web.js client initialize karti hai
| - QR generate karti hai
| - session ready/auth/disconnect state track karti hai
| - message send karti hai
|
*/

const fs = require('fs');
const path = require('path');

class WhatsAppService {
    constructor() {
        this.client = null;
        this.sessionId = process.env.WHATSAPP_SESSION_ID || 'default';
        this.state = {
            status: 'uninitialized',
            qrDataUrl: null,
            phoneNumber: null,
            lastError: null,
            updatedAt: Date.now()
        };
        this.isStarting = false;
        this.supported = null;
        this.wwebjs = null;
        this.qrcode = null;
    }

    _touch(partial = {}) {
        this.state = {
            ...this.state,
            ...partial,
            updatedAt: Date.now()
        };
    }

    _loadDependencies() {
        if (this.supported !== null) return this.supported;
        try {
            // Lazy require se backend boot tab bhi ho jata hai jab WhatsApp deps installed na hon.
            this.wwebjs = require('whatsapp-web.js');
            this.qrcode = require('qrcode');
            this.supported = true;
        } catch (err) {
            this.supported = false;
            this._touch({
                status: 'unsupported',
                lastError: 'WhatsApp dependencies missing. Install: npm i whatsapp-web.js qrcode'
            });
        }
        return this.supported;
    }

    _normalizePhone(phone) {
        const digits = String(phone || '').replace(/[^\d]/g, '');
        if (!digits) return '';
        return `${digits}@c.us`;
    }

    getStatus() {
        return {
            sessionId: this.sessionId,
            ...this.state
        };
    }

    async startSession() {
        if (!this._loadDependencies()) {
            throw new Error(this.state.lastError || 'WhatsApp dependencies unavailable');
        }

        if (this.client && this.state.status === 'ready') {
            return this.getStatus();
        }

        if (this.isStarting) {
            return this.getStatus();
        }

        this.isStarting = true;
        this._touch({ status: 'initializing', lastError: null });

        try {
            if (this.client) {
                try {
                    await this.client.destroy();
                } catch (err) {
                    // no-op
                }
                this.client = null;
            }

            const authRoot = process.env.WHATSAPP_AUTH_PATH
                ? path.resolve(process.env.WHATSAPP_AUTH_PATH)
                : path.resolve(__dirname, 'backend', '.wwebjs_auth');
            fs.mkdirSync(authRoot, { recursive: true });

            const { Client, LocalAuth } = this.wwebjs;
            this.client = new Client({
                authStrategy: new LocalAuth({
                    clientId: this.sessionId,
                    dataPath: authRoot
                }),
                puppeteer: {
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                }
            });

            this.client.on('qr', async (qr) => {
                try {
                    const qrDataUrl = await this.qrcode.toDataURL(qr, { margin: 1, width: 320 });
                    this._touch({
                        status: 'qr',
                        qrDataUrl,
                        phoneNumber: null,
                        lastError: null
                    });
                } catch (err) {
                    this._touch({
                        status: 'error',
                        lastError: `QR rendering failed: ${err?.message || String(err)}`
                    });
                }
            });

            this.client.on('authenticated', () => {
                this._touch({
                    status: 'authenticated',
                    lastError: null
                });
            });

            this.client.on('ready', () => {
                const number = this.client?.info?.wid?.user || null;
                this._touch({
                    status: 'ready',
                    qrDataUrl: null,
                    phoneNumber: number,
                    lastError: null
                });
            });

            this.client.on('auth_failure', (msg) => {
                this._touch({
                    status: 'auth_failure',
                    qrDataUrl: null,
                    lastError: msg || 'Authentication failed'
                });
            });

            this.client.on('disconnected', (reason) => {
                this._touch({
                    status: 'disconnected',
                    phoneNumber: null,
                    qrDataUrl: null,
                    lastError: reason || 'Disconnected'
                });
            });

            await this.client.initialize();
            return this.getStatus();
        } catch (err) {
            this._touch({
                status: 'error',
                lastError: err?.message || String(err)
            });
            throw err;
        } finally {
            this.isStarting = false;
        }
    }

    async logout() {
        if (!this.client) {
            this._touch({
                status: 'uninitialized',
                qrDataUrl: null,
                phoneNumber: null
            });
            return this.getStatus();
        }

        try {
            try {
                await this.client.logout();
            } catch (err) {
                // Session already gone ho to bhi destroy continue karega.
            }
            await this.client.destroy();
            this.client = null;
            this._touch({
                status: 'uninitialized',
                qrDataUrl: null,
                phoneNumber: null,
                lastError: null
            });
            return this.getStatus();
        } catch (err) {
            this._touch({
                status: 'error',
                lastError: err?.message || String(err)
            });
            throw err;
        }
    }

    async sendMessage(phone, text) {
        const jid = this._normalizePhone(phone);
        if (!jid) {
            throw new Error('Invalid phone number');
        }

        if (!this.client || this.state.status !== 'ready') {
            throw new Error('WhatsApp session not ready. Please scan QR and login first.');
        }

        const content = String(text || '').trim();
        if (!content) {
            throw new Error('Message content is empty');
        }

        const sent = await this.client.sendMessage(jid, content);
        return {
            jid,
            id: sent?.id?._serialized || null
        };
    }
}

/*
|--------------------------------------------------------------------------
| SECTION 2: WhatsApp Session + Campaign Controller APIs
| Source: backend/controllers/campaignController.js
|--------------------------------------------------------------------------
|
| Ye handlers:
| - WhatsApp session start/status/logout expose karte hain
| - bulk WhatsApp campaign job start/status/cancel karte hain
|
*/

async function startWhatsAppSession(req, res) {
    try {
        const status = await whatsappService.startSession();
        return res.json({ success: true, session: status });
    } catch (err) {
        return sendApiError(res, err, { status: 500, fallbackMessage: 'Failed to start WhatsApp session' });
    }
}

async function getWhatsAppSessionStatus(req, res) {
    try {
        const status = whatsappService.getStatus();
        return res.json({ success: true, session: status });
    } catch (err) {
        return sendApiError(res, err, { status: 500, fallbackMessage: 'Failed to fetch WhatsApp status' });
    }
}

async function logoutWhatsAppSession(req, res) {
    try {
        const status = await whatsappService.logout();
        return res.json({ success: true, session: status });
    } catch (err) {
        return sendApiError(res, err, { status: 500, fallbackMessage: 'Failed to logout WhatsApp session' });
    }
}

async function startLogsWhatsAppCampaign(req, res) {
    try {
        const session = whatsappService.getStatus();
        if (session.status !== 'ready') {
            return res.status(400).json({
                error: 'WhatsApp session is not ready. Please scan QR and connect first.'
            });
        }

        const payload = sanitizeOutreachCampaignPayload(req.body);
        const recipientsInput = payload.recipients;
        const templateId = payload.templateId;
        const customTemplate = payload.customTemplate;
        const gapSeconds = payload.gapSeconds;

        // Recipient dedupe taaki same user ko duplicate WhatsApp na jaye.
        const dedupedRecipients = [];
        const seen = new Set();
        for (const raw of recipientsInput) {
            const recipient = raw && typeof raw === 'object' ? raw : {};
            const key = String(recipient.leadId || recipient.phone || recipient.email || recipient.callLogId || '').trim();
            if (!key || seen.has(key)) continue;
            seen.add(key);
            dedupedRecipients.push({
                leadId: recipient.leadId || null,
                callLogId: recipient.callLogId || null,
                email: recipient.email || null,
                phone: recipient.phone || null,
                name: recipient.name || null
            });
        }

        if (dedupedRecipients.length === 0) {
            return res.status(400).json({ error: 'No valid recipients selected' });
        }

        if (templateId === 'custom') {
            const customBody = compactText(customTemplate?.body || '');
            if (!customBody) {
                return res.status(400).json({ error: 'Custom template body is required' });
            }
        }

        const jobId = randomId();
        const createdAt = Date.now();
        const job = {
            id: jobId,
            status: 'queued',
            createdAt,
            startedAt: null,
            finishedAt: null,
            gapSeconds,
            templateId,
            customTemplate: templateId === 'custom' ? customTemplate : null,
            recipients: dedupedRecipients,
            total: dedupedRecipients.length,
            processed: 0,
            sent: 0,
            failed: 0,
            cancelRequested: false,
            lastError: null,
            results: []
        };

        whatsappCampaignJobs.set(jobId, job);
        pruneOldWhatsAppJobs();

        setImmediate(() => {
            runWhatsAppCampaignJob(jobId).catch((err) => {
                const trackedJob = whatsappCampaignJobs.get(jobId);
                if (!trackedJob) return;
                trackedJob.status = 'failed';
                trackedJob.lastError = err?.message || String(err);
                trackedJob.finishedAt = Date.now();
            });
        });

        return res.json({ success: true, job: buildJobStatus(job) });
    } catch (err) {
        return sendApiError(res, err, { status: 500, fallbackMessage: 'Failed to start WhatsApp campaign' });
    }
}

async function getLogsWhatsAppCampaignStatus(req, res) {
    const jobId = String(req.params.jobId || '');
    const job = whatsappCampaignJobs.get(jobId);
    if (!job) {
        return res.status(404).json({ error: 'WhatsApp campaign job not found' });
    }
    return res.json({ success: true, job: buildJobStatus(job) });
}

async function cancelLogsWhatsAppCampaign(req, res) {
    const jobId = String(req.params.jobId || '');
    const job = whatsappCampaignJobs.get(jobId);
    if (!job) {
        return res.status(404).json({ error: 'WhatsApp campaign job not found' });
    }

    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        return res.json({ success: true, job: buildJobStatus(job) });
    }

    job.cancelRequested = true;
    if (job.status === 'queued') {
        job.status = 'cancelled';
        job.finishedAt = Date.now();
    }

    return res.json({ success: true, job: buildJobStatus(job) });
}

/*
|--------------------------------------------------------------------------
| SECTION 3: Automation Dispatch Snippet
| Source: backend/services/campaignAutomationService.js
|--------------------------------------------------------------------------
|
| Ye snippet queued automation task process karte waqt WhatsApp channel handle karta hai.
| Isme:
| - recipient phone check
| - WhatsApp session ready check
| - message content build
| - send
| - outreach status update
|
*/

async function processWhatsAppAutomationTask(task, lead, channelConfig, summary, isGlobalIntroTask) {
    const toPhone = normalizeText(lead.number);
    if (!toPhone) {
        await markTask(task._id, 'skipped', { lastError: 'Recipient phone missing', sentAt: new Date() });
        return;
    }

    const waStatus = whatsappService.getStatus();
    if (waStatus.status !== 'ready') {
        throw new Error('WhatsApp session not ready');
    }

    const waContent = isGlobalIntroTask
        ? buildGlobalIntroContent({ channel: 'whatsapp', name: lead.name })
        : buildChannelContent({
            channel: 'whatsapp',
            templateConfig: channelConfig,
            name: lead.name,
            summary
        });

    await whatsappService.sendMessage(toPhone, waContent.body);
    await updateLeadOutreach('whatsapp', lead._id, 'sent', null);

    await markTask(task._id, 'sent', {
        sentAt: new Date(),
        lastError: null
    });
}

/*
|--------------------------------------------------------------------------
| SECTION 4: Express Route Map
| Source: backend/routes/campaignRoutes.js
|--------------------------------------------------------------------------
|
| Ye WhatsApp related backend HTTP routes hain.
|
*/

const whatsappRoutesReference = [
    "router.post('/logs/whatsapp/session/start', requireAuth, controller.startWhatsAppSession);",
    "router.get('/logs/whatsapp/session/status', requireAuth, controller.getWhatsAppSessionStatus);",
    "router.post('/logs/whatsapp/session/logout', requireAuth, controller.logoutWhatsAppSession);",
    "router.post('/logs/whatsapp-campaign/start', requireAuth, controller.startLogsWhatsAppCampaign);",
    "router.get('/logs/whatsapp-campaign/:jobId/status', requireAuth, controller.getLogsWhatsAppCampaignStatus);",
    "router.post('/logs/whatsapp-campaign/:jobId/cancel', requireAuth, controller.cancelLogsWhatsAppCampaign);"
];

/*
|--------------------------------------------------------------------------
| SECTION 5: Frontend Locations
|--------------------------------------------------------------------------
|
| UI side WhatsApp related logic in files:
| - frontend/src/pages/CampaignManagement.jsx
|   - session start / refresh / logout
|   - QR display
|   - campaign intro outreach dashboard counters
|
| - frontend/src/pages/Logs.jsx
|   - manual WhatsApp automation
|   - template editor / preview / saved templates
|   - QR session control
|   - send progress tracking
|
*/

module.exports = {
    WhatsAppService,
    startWhatsAppSession,
    getWhatsAppSessionStatus,
    logoutWhatsAppSession,
    startLogsWhatsAppCampaign,
    getLogsWhatsAppCampaignStatus,
    cancelLogsWhatsAppCampaign,
    processWhatsAppAutomationTask,
    whatsappRoutesReference
};
