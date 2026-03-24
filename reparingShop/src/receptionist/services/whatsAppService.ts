import api from '../../admin/services/api';

export interface GroupMember {
    _id?: string;
    id?: string; // For backward compatibility if needed
    name: string;
    mobile: string;
    role: 'mechanic' | 'driver' | 'manager' | 'receptionist';
}

export interface WhatsAppGroup {
    _id: string;
    name: string;
    members: GroupMember[];
    createdAt: string;
    updatedAt: string;
}

export interface WhatsAppTemplate {
    _id: string;
    title: string;
    body: string;
    driverName?: string;
    driverNumber?: string;
    companyName?: string;
    contactNumber?: string;
    createdAt: string;
    updatedAt: string;
}

const whatsAppService = {
    // Groups
    async getAllGroups(): Promise<WhatsAppGroup[]> {
        const { data } = await api.get('/whatsapp/groups');
        return data.data;
    },

    async createGroup(group: Partial<WhatsAppGroup>): Promise<WhatsAppGroup> {
        const { data } = await api.post('/whatsapp/groups', group);
        return data.data;
    },

    async updateGroup(id: string, group: Partial<WhatsAppGroup>): Promise<WhatsAppGroup> {
        const { data } = await api.put(`/whatsapp/groups/${id}`, group);
        return data.data;
    },

    async deleteGroup(id: string): Promise<void> {
        await api.delete(`/whatsapp/groups/${id}`);
    },

    // Templates
    async getAllTemplates(): Promise<WhatsAppTemplate[]> {
        const { data } = await api.get('/whatsapp/templates');
        return data.data;
    },

    async createTemplate(template: Partial<WhatsAppTemplate>): Promise<WhatsAppTemplate> {
        const { data } = await api.post('/whatsapp/templates', template);
        return data.data;
    } ,

    async updateTemplate(id: string, template: Partial<WhatsAppTemplate>): Promise<WhatsAppTemplate> {
        const { data } = await api.put(`/whatsapp/templates/${id}`, template);
        return data.data;
    },

    async deleteTemplate(id: string): Promise<void> {
        await api.delete(`/whatsapp/templates/${id}`);
    }
};

export default whatsAppService;
