import api from '../../admin/services/api';

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

export interface TemplateVariables {
    driverName?: string;
    driverNumber?: string;
    companyName?: string;
    contactNumber?: string;
    [key: string]: string | undefined;
}

const whatsappCampaignService = {
    async startCampaign(
        recipients: CampaignRecipient[],
        _templateBody: string,   // stored in DB, not needed by backend (uses Interakt template name)
        variables?: TemplateVariables
    ): Promise<CampaignStatus> {
        const { data } = await api.post('/whatsapp/send-campaign', {
            recipients,
            templateVars: variables,   // matches what whatsAppController.js reads
        });
        return data.job;
    }
};

export default whatsappCampaignService;
