import api from './api';

export interface MechanicFromAPI {
    _id: string;
    mechanicId: string;
    name: string;
    email: string;
    experience: string;
    specialty: string;
    avatar: string;
    available: boolean;
    mobile: string;
    role: string;
    createdAt: string;
    updatedAt: string;
}

const mechanicService = {
    getAll: (params?: { available?: string; search?: string }) =>
        api.get<{ success: boolean; count: number; data: MechanicFromAPI[] }>('/mechanics', { params }),

    getById: (id: string) =>
        api.get<{ success: boolean; data: MechanicFromAPI }>(`/mechanics/${id}`),
};

export default mechanicService;
