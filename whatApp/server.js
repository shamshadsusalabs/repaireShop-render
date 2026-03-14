/*
  Standalone WhatsApp Server
  --------------------------
  Port: 3001 (conflict-free with main server on 3000)
  Run:  npm install && npm run dev
  
  Features:
  - WhatsApp session management (QR, login, logout)
  - Bulk campaign send with gap/dedup/cancel
  - Browser dashboard at https://repaireshop-2.onrender.com
*/

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── Health check for Render ──────────────────────────────────────────────────
app.get('/health', (req, res) => res.status(200).send('OK'));

// ─── Utility Functions ────────────────────────────────────────────────────────

function sendApiError(res, err, { status = 500, fallbackMessage = 'Internal server error' } = {}) {
    console.error('[API Error]', err?.message || err);
    return res.status(status).json({
        success: false,
        error: err?.message || fallbackMessage
    });
}

function randomId() {
    return crypto.randomBytes(12).toString('hex');
}

function compactText(str) {
    return String(str || '').replace(/\s+/g, ' ').trim();
}

function normalizeText(str) {
    return String(str || '').trim();
}

function sanitizeOutreachCampaignPayload(body) {
    return {
        recipients: Array.isArray(body?.recipients) ? body.recipients : [],
        templateId: String(body?.templateId || 'custom'),
        customTemplate: body?.customTemplate || null,
        gapSeconds: Math.max(1, Math.min(60, Number(body?.gapSeconds) || 5))
    };
}

function buildJobStatus(job) {
    return {
        id: job.id,
        status: job.status,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        total: job.total,
        processed: job.processed,
        sent: job.sent,
        failed: job.failed,
        lastError: job.lastError,
        results: job.results
    };
}

// ─── In-Memory Campaign Job Store ─────────────────────────────────────────────

const whatsappCampaignJobs = new Map();
const MAX_JOBS = 50;

function pruneOldWhatsAppJobs() {
    if (whatsappCampaignJobs.size <= MAX_JOBS) return;
    const entries = [...whatsappCampaignJobs.entries()]
        .sort((a, b) => a[1].createdAt - b[1].createdAt);
    while (whatsappCampaignJobs.size > MAX_JOBS) {
        const [oldKey] = entries.shift();
        whatsappCampaignJobs.delete(oldKey);
    }
}

// ─── WhatsApp Service ─────────────────────────────────────────────────────────

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
        console.log(`[WhatsApp] Status → ${this.state.status}`);
    }

    _loadDependencies() {
        if (this.supported !== null) return this.supported;
        try {
            this.wwebjs = require('whatsapp-web.js');
            this.qrcode = require('qrcode');
            this.supported = true;
            console.log('[WhatsApp] Dependencies loaded ✓');
        } catch (err) {
            this.supported = false;
            this._touch({
                status: 'unsupported',
                lastError: 'WhatsApp dependencies missing. Run: npm install'
            });
            console.error('[WhatsApp] Dependencies MISSING:', err.message);
        }
        return this.supported;
    }

    _normalizePhone(phone) {
        let digits = String(phone || '').replace(/[^\d]/g, '');
        if (!digits) return '';
        // Auto-add India country code for 10-digit numbers starting with 6-9
        if (digits.length === 10 && /^[6-9]/.test(digits)) {
            digits = '91' + digits;
        }
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
                try { await this.client.destroy(); } catch (_) { }
                this.client = null;
            }

            const authRoot = path.resolve(__dirname, '.wwebjs_auth');
            fs.mkdirSync(authRoot, { recursive: true });

            const { Client, LocalAuth } = this.wwebjs;
            this.client = new Client({
                authStrategy: new LocalAuth({
                    clientId: this.sessionId,
                    dataPath: authRoot
                }),
                puppeteer: {
                    headless: true,
                    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu'
                    ]
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
                this._touch({ status: 'authenticated', lastError: null });
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
            console.error('[WhatsApp] Initialization FAILED:', err);
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
            this._touch({ status: 'uninitialized', qrDataUrl: null, phoneNumber: null });
            return this.getStatus();
        }

        try {
            try { await this.client.logout(); } catch (_) { }
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
            this._touch({ status: 'error', lastError: err?.message || String(err) });
            throw err;
        }
    }

    async sendMessage(phone, text) {
        const jid = this._normalizePhone(phone);
        if (!jid) throw new Error('Invalid phone number');

        if (!this.client || this.state.status !== 'ready') {
            throw new Error('WhatsApp session not ready. Please scan QR and login first.');
        }

        const content = String(text || '').trim();
        if (!content) throw new Error('Message content is empty');

        // Route via getContactById → getChat to avoid 'No LID for user' bug
        // in newer versions of whatsapp-web.js
        try {
            const contact = await this.client.getContactById(jid);
            const chat = await contact.getChat();
            const sent = await chat.sendMessage(content);
            return {
                jid,
                id: sent?.id?._serialized || null
            };
        } catch (lidErr) {
            // Fallback to direct sendMessage if contact route fails
            const sent = await this.client.sendMessage(jid, content);
            return {
                jid,
                id: sent?.id?._serialized || null
            };
        }
    }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

const whatsappService = new WhatsAppService();

// ─── Campaign Runner ──────────────────────────────────────────────────────────

async function runWhatsAppCampaignJob(jobId) {
    const job = whatsappCampaignJobs.get(jobId);
    if (!job) return;

    job.status = 'running';
    job.startedAt = Date.now();

    for (let i = 0; i < job.recipients.length; i++) {
        if (job.cancelRequested) {
            job.status = 'cancelled';
            job.finishedAt = Date.now();
            return;
        }

        const recipient = job.recipients[i];
        const phone = recipient.phone;
        const name = recipient.name || 'there';

        let messageBody = '';
        if (job.templateId === 'custom' && job.customTemplate) {
            messageBody = (job.customTemplate.body || '')
                .replace(/\{\{name\}\}/gi, name)
                .replace(/\{\{phone\}\}/gi, phone || '');
        } else {
            messageBody = `Hi ${name}, this is a message from our WhatsApp campaign.`;
        }

        try {
            const result = await whatsappService.sendMessage(phone, messageBody);
            job.sent++;
            job.results.push({
                phone, name, status: 'sent',
                messageId: result.id, error: null
            });
        } catch (err) {
            job.failed++;
            job.results.push({
                phone, name, status: 'failed',
                messageId: null, error: err?.message || String(err)
            });
        }

        job.processed++;

        // Gap between messages
        if (i < job.recipients.length - 1 && job.gapSeconds > 0) {
            await new Promise(resolve => setTimeout(resolve, job.gapSeconds * 1000));
        }
    }

    job.status = job.failed === job.total ? 'failed' : 'completed';
    job.finishedAt = Date.now();
}

// ─── API Routes ───────────────────────────────────────────────────────────────

// Session
app.post('/api/whatsapp/session/start', async (req, res) => {
    try {
        const status = await whatsappService.startSession();
        return res.json({ success: true, session: status });
    } catch (err) {
        return sendApiError(res, err, { fallbackMessage: 'Failed to start WhatsApp session' });
    }
});

app.get('/api/whatsapp/session/status', async (req, res) => {
    try {
        const status = whatsappService.getStatus();
        return res.json({ success: true, session: status });
    } catch (err) {
        return sendApiError(res, err, { fallbackMessage: 'Failed to fetch WhatsApp status' });
    }
});

app.post('/api/whatsapp/session/logout', async (req, res) => {
    try {
        const status = await whatsappService.logout();
        return res.json({ success: true, session: status });
    } catch (err) {
        return sendApiError(res, err, { fallbackMessage: 'Failed to logout WhatsApp session' });
    }
});

// Campaign
app.post('/api/whatsapp/campaign/start', async (req, res) => {
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

        // Dedup
        const dedupedRecipients = [];
        const seen = new Set();
        for (const raw of recipientsInput) {
            const recipient = raw && typeof raw === 'object' ? raw : {};
            const key = String(recipient.phone || recipient.name || '').trim();
            if (!key || seen.has(key)) continue;
            seen.add(key);
            dedupedRecipients.push({
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
        const job = {
            id: jobId,
            status: 'queued',
            createdAt: Date.now(),
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
        return sendApiError(res, err, { fallbackMessage: 'Failed to start WhatsApp campaign' });
    }
});

app.get('/api/whatsapp/campaign/:jobId/status', async (req, res) => {
    const jobId = String(req.params.jobId || '');
    const job = whatsappCampaignJobs.get(jobId);
    if (!job) {
        return res.status(404).json({ error: 'WhatsApp campaign job not found' });
    }
    return res.json({ success: true, job: buildJobStatus(job) });
});

app.post('/api/whatsapp/campaign/:jobId/cancel', async (req, res) => {
    const jobId = String(req.params.jobId || '');
    const job = whatsappCampaignJobs.get(jobId);
    if (!job) {
        return res.status(404).json({ error: 'WhatsApp campaign job not found' });
    }

    if (['completed', 'failed', 'cancelled'].includes(job.status)) {
        return res.json({ success: true, job: buildJobStatus(job) });
    }

    job.cancelRequested = true;
    if (job.status === 'queued') {
        job.status = 'cancelled';
        job.finishedAt = Date.now();
    }

    return res.json({ success: true, job: buildJobStatus(job) });
});

// Send single test message
app.post('/api/whatsapp/send', async (req, res) => {
    try {
        const { phone, message } = req.body;
        const result = await whatsappService.sendMessage(phone, message);
        return res.json({ success: true, result });
    } catch (err) {
        return sendApiError(res, err, { fallbackMessage: 'Failed to send message' });
    }
});

// ─── Browser Dashboard (HTML) ─────────────────────────────────────────────────

app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Standalone Dashboard</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Inter', sans-serif;
            background: #0f0f0f;
            color: #e0e0e0;
            min-height: 100vh;
        }

        .header {
            background: linear-gradient(135deg, #075e54 0%, #128c7e 50%, #25d366 100%);
            padding: 24px 32px;
            display: flex;
            align-items: center;
            gap: 16px;
            box-shadow: 0 4px 20px rgba(37, 211, 102, 0.3);
        }

        .header svg {
            width: 40px;
            height: 40px;
            fill: white;
        }

        .header h1 {
            font-size: 22px;
            font-weight: 700;
            color: white;
            letter-spacing: -0.3px;
        }

        .header p {
            font-size: 13px;
            color: rgba(255,255,255,0.8);
            margin-top: 2px;
        }

        .container {
            max-width: 900px;
            margin: 32px auto;
            padding: 0 24px;
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        .card {
            background: #1a1a1a;
            border: 1px solid #2a2a2a;
            border-radius: 16px;
            padding: 24px;
            transition: border-color 0.3s;
        }

        .card:hover { border-color: #25d366; }

        .card-title {
            font-size: 16px;
            font-weight: 600;
            color: #25d366;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .status-bar {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            background: #111;
            border-radius: 10px;
            margin-bottom: 16px;
        }

        .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #666;
            flex-shrink: 0;
        }

        .status-dot.ready            { background: #25d366; box-shadow: 0 0 8px #25d366; }
        .status-dot.qr               { background: #f0b429; box-shadow: 0 0 8px #f0b429; animation: pulse 1.5s infinite; }
        .status-dot.initializing      { background: #3b82f6; box-shadow: 0 0 8px #3b82f6; animation: pulse 1s infinite; }
        .status-dot.authenticated     { background: #22d3ee; box-shadow: 0 0 8px #22d3ee; }
        .status-dot.error,
        .status-dot.auth_failure      { background: #ef4444; box-shadow: 0 0 8px #ef4444; }
        .status-dot.disconnected      { background: #f97316; box-shadow: 0 0 8px #f97316; }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }

        .status-text {
            font-size: 14px;
            font-weight: 500;
        }

        .status-phone {
            margin-left: auto;
            font-size: 13px;
            color: #888;
        }

        .btn-row {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        button {
            padding: 10px 20px;
            border-radius: 10px;
            border: none;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        button:active { transform: scale(0.97); }

        .btn-primary {
            background: linear-gradient(135deg, #25d366, #128c7e);
            color: white;
        }
        .btn-primary:hover { box-shadow: 0 4px 16px rgba(37, 211, 102, 0.4); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-danger {
            background: linear-gradient(135deg, #ef4444, #b91c1c);
            color: white;
        }
        .btn-danger:hover { box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4); }

        .btn-secondary {
            background: #2a2a2a;
            color: #ccc;
            border: 1px solid #333;
        }
        .btn-secondary:hover { background: #333; }

        .qr-box {
            display: flex;
            justify-content: center;
            padding: 20px;
        }

        .qr-box img {
            border-radius: 12px;
            border: 3px solid #25d366;
            box-shadow: 0 0 30px rgba(37, 211, 102, 0.2);
        }

        .form-group {
            margin-bottom: 14px;
        }

        label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: #999;
            margin-bottom: 6px;
        }

        input, textarea {
            width: 100%;
            padding: 10px 14px;
            border-radius: 10px;
            border: 1px solid #333;
            background: #111;
            color: #e0e0e0;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            transition: border-color 0.2s;
        }

        input:focus, textarea:focus {
            outline: none;
            border-color: #25d366;
            box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.1);
        }

        textarea { resize: vertical; min-height: 80px; }

        .log-box {
            background: #111;
            border-radius: 10px;
            padding: 16px;
            max-height: 250px;
            overflow-y: auto;
            font-family: 'SF Mono', 'Fira Code', monospace;
            font-size: 12px;
            line-height: 1.8;
            color: #888;
        }

        .log-box .log-entry { margin-bottom: 2px; }
        .log-box .success { color: #25d366; }
        .log-box .error   { color: #ef4444; }
        .log-box .info    { color: #3b82f6; }
        .log-box .warn    { color: #f0b429; }

        .error-banner {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 10px;
            padding: 12px 16px;
            color: #ef4444;
            font-size: 13px;
            margin-bottom: 16px;
            display: none;
        }

        .hidden { display: none; }
    </style>
</head>
<body>

<div class="header">
    <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.117 1.52 5.853L.06 23.65a.5.5 0 00.609.61l5.855-1.488A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 01-5.39-1.582l-.387-.232-3.474.882.9-3.42-.254-.404A9.935 9.935 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
    <div>
        <h1>WhatsApp Standalone Server</h1>
        <p>Session Management • Message Sending • Campaign Dashboard</p>
    </div>
</div>

<div class="container">

    <!-- Session Card -->
    <div class="card">
        <div class="card-title">📱 Session</div>
        <div class="status-bar">
            <div class="status-dot" id="statusDot"></div>
            <span class="status-text" id="statusText">Checking...</span>
            <span class="status-phone" id="statusPhone"></span>
        </div>
        <div class="error-banner" id="errorBanner"></div>
        <div class="qr-box hidden" id="qrBox">
            <img id="qrImage" src="" alt="QR Code" width="280" height="280"/>
        </div>
        <div class="btn-row">
            <button class="btn-primary" id="btnStart" onclick="startSession()">▶ Start Session</button>
            <button class="btn-secondary" onclick="refreshStatus()">🔄 Refresh</button>
            <button class="btn-danger" id="btnLogout" onclick="logoutSession()">⏹ Logout</button>
        </div>
    </div>

    <!-- Send Message Card -->
    <div class="card">
        <div class="card-title">💬 Send Test Message</div>
        <div class="form-group">
            <label for="sendPhone">Phone Number (with country code, e.g. 919876543210)</label>
            <input id="sendPhone" type="text" placeholder="919876543210" />
        </div>
        <div class="form-group">
            <label for="sendMessage">Message</label>
            <textarea id="sendMessage" placeholder="Type your message here..."></textarea>
        </div>
        <div class="btn-row">
            <button class="btn-primary" id="btnSend" onclick="sendTestMessage()">📤 Send Message</button>
        </div>
    </div>

    <!-- Logs Card -->
    <div class="card">
        <div class="card-title">📋 Activity Log</div>
        <div class="log-box" id="logBox">
            <div class="log-entry info">Dashboard loaded. Waiting for actions...</div>
        </div>
    </div>

</div>

<script>
    const BASE = '';
    let pollInterval = null;

    function addLog(msg, type = 'info') {
        const box = document.getElementById('logBox');
        const entry = document.createElement('div');
        entry.className = 'log-entry ' + type;
        const ts = new Date().toLocaleTimeString();
        entry.textContent = '[' + ts + '] ' + msg;
        box.appendChild(entry);
        box.scrollTop = box.scrollHeight;
    }

    function updateUI(session) {
        const dot = document.getElementById('statusDot');
        const text = document.getElementById('statusText');
        const phone = document.getElementById('statusPhone');
        const qrBox = document.getElementById('qrBox');
        const qrImg = document.getElementById('qrImage');
        const errorBanner = document.getElementById('errorBanner');
        const btnStart = document.getElementById('btnStart');

        const st = session.status || 'uninitialized';

        dot.className = 'status-dot ' + st;
        text.textContent = st.charAt(0).toUpperCase() + st.slice(1);
        phone.textContent = session.phoneNumber ? ('📞 +' + session.phoneNumber) : '';

        if (session.lastError) {
            errorBanner.style.display = 'block';
            errorBanner.textContent = '⚠ ' + session.lastError;
        } else {
            errorBanner.style.display = 'none';
        }

        if (st === 'qr' && session.qrDataUrl) {
            qrBox.classList.remove('hidden');
            qrImg.src = session.qrDataUrl;
        } else {
            qrBox.classList.add('hidden');
        }

        btnStart.disabled = (st === 'initializing' || st === 'qr' || st === 'authenticated');

        // Auto-poll while connecting
        if (['initializing', 'qr', 'authenticated'].includes(st)) {
            if (!pollInterval) {
                pollInterval = setInterval(refreshStatus, 3000);
            }
        } else {
            if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
            }
        }
    }

    async function refreshStatus() {
        try {
            const res = await fetch(BASE + '/api/whatsapp/session/status');
            const data = await res.json();
            if (data.success) updateUI(data.session);
        } catch (err) {
            addLog('Status fetch failed: ' + err.message, 'error');
        }
    }

    async function startSession() {
        addLog('Starting WhatsApp session...', 'info');
        document.getElementById('btnStart').disabled = true;
        try {
            const res = await fetch(BASE + '/api/whatsapp/session/start', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                updateUI(data.session);
                addLog('Session initialization started. Scan QR when it appears.', 'success');
            } else {
                addLog('Start failed: ' + (data.error || 'Unknown'), 'error');
            }
        } catch (err) {
            addLog('Start error: ' + err.message, 'error');
            document.getElementById('btnStart').disabled = false;
        }
    }

    async function logoutSession() {
        addLog('Logging out...', 'warn');
        try {
            const res = await fetch(BASE + '/api/whatsapp/session/logout', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                updateUI(data.session);
                addLog('Logged out successfully.', 'success');
            } else {
                addLog('Logout failed: ' + (data.error || 'Unknown'), 'error');
            }
        } catch (err) {
            addLog('Logout error: ' + err.message, 'error');
        }
    }

    async function sendTestMessage() {
        const phone = document.getElementById('sendPhone').value.trim();
        const message = document.getElementById('sendMessage').value.trim();
        if (!phone || !message) {
            addLog('Phone and message are required!', 'error');
            return;
        }
        addLog('Sending to ' + phone + '...', 'info');
        try {
            const res = await fetch(BASE + '/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, message })
            });
            const data = await res.json();
            if (data.success) {
                addLog('Message sent! ID: ' + (data.result?.id || 'N/A'), 'success');
                document.getElementById('sendMessage').value = '';
            } else {
                addLog('Send failed: ' + (data.error || 'Unknown'), 'error');
            }
        } catch (err) {
            addLog('Send error: ' + err.message, 'error');
        }
    }

    // Initial load
    refreshStatus();
</script>

</body>
</html>`);
});

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════════════════╗');
    console.log('  ║   WhatsApp Standalone Server                    ║');
    console.log('  ║   Status:    READY/LISTENING                    ║');
    console.log('  ║   Port:      ' + PORT + '                               ║');
    console.log('  ║   Interface: 0.0.0.0                            ║');
    console.log('  ╚══════════════════════════════════════════════════╝');
    console.log('');
});
