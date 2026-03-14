import axios from 'axios';

const WHATSAPP_SERVER_URL = 'https://repaireshop-render-1.onrender.com/api/whatsapp';

export interface WhatsAppSession {
    sessionId: string;
    status: 'uninitialized' | 'initializing' | 'qr' | 'authenticated' | 'ready' | 'auth_failure' | 'disconnected' | 'error';
    qrDataUrl?: string;
    phoneNumber?: string;
    lastError?: string;
    updatedAt: number;
}

export interface CampaignRecipient {
    phone: string;
    name: string;
}

export interface CampaignStatus {
    id: string;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    total: number;
    processed: number;
    sent: number;
    failed: number;
}

const whatsappCampaignService = {
    async getSessionStatus(): Promise<WhatsAppSession> {
        const { data } = await axios.get(`${WHATSAPP_SERVER_URL}/session/status`);
        return data.session;
    },

    async startSession(): Promise<WhatsAppSession> {
        const { data } = await axios.post(`${WHATSAPP_SERVER_URL}/session/start`);
        return data.session;
    },

    async logoutSession(): Promise<WhatsAppSession> {
        const { data } = await axios.post(`${WHATSAPP_SERVER_URL}/session/logout`);
        return data.session;
    },

    async startCampaign(recipients: CampaignRecipient[], templateBody: string): Promise<CampaignStatus> {
        const { data } = await axios.post(`${WHATSAPP_SERVER_URL}/campaign/start`, {
            recipients,
            templateId: 'custom',
            customTemplate: { body: templateBody },
            gapSeconds: 2
        });
        return data.job;
    },

    async getCampaignStatus(jobId: string): Promise<CampaignStatus> {
        const { data } = await axios.get(`${WHATSAPP_SERVER_URL}/campaign/${jobId}/status`);
        return data.job;
    }
};

export default whatsappCampaignService;
