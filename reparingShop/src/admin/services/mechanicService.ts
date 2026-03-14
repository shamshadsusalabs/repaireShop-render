import api from './api';
import type { Mechanic } from '../../types';

export interface CreateMechanicPayload {
    name: string;
    email: string;
    password: string;
    experience: string;
    specialty: string;
    mobile?: string;
    avatar?: string;
}

export interface UpdateMechanicPayload {
    name?: string;
    email?: string;
    password?: string;
    experience?: string;
    specialty?: string;
    mobile?: string;
    avatar?: string;
    available?: boolean;
}

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

    create: (payload: CreateMechanicPayload) =>
        api.post<{ success: boolean; data: MechanicFromAPI }>('/mechanics', payload),

    update: (id: string, payload: UpdateMechanicPayload) =>
        api.put<{ success: boolean; data: MechanicFromAPI }>(`/mechanics/${id}`, payload),

    delete: (id: string) =>
        api.delete(`/mechanics/${id}`),
};

// Helper to convert API mechanic to frontend Mechanic type
export function toFrontendMechanic(m: MechanicFromAPI): Mechanic {
    return {
        id: m.mechanicId,
        name: m.name,
        experience: m.experience,
        specialty: m.specialty,
        avatar: m.avatar,
        available: m.available,
    };
}

export default mechanicService;
