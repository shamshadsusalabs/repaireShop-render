import api from './api';
import type { InspectionItem } from '../../types';

export interface CreateInspectionItemPayload {
    name: string;
    icon?: string;
}

export interface UpdateInspectionItemPayload {
    name?: string;
    icon?: string;
}

const inspectionItemService = {
    getAll: () =>
        api.get<{ success: boolean; count: number; data: InspectionItem[] }>('/inspection-items'),

    create: (payload: CreateInspectionItemPayload) =>
        api.post<{ success: boolean; data: InspectionItem }>('/inspection-items', payload),

    update: (id: string, payload: UpdateInspectionItemPayload) =>
        api.put<{ success: boolean; data: InspectionItem }>(`/inspection-items/${id}`, payload),

    delete: (id: string) =>
        api.delete<{ success: boolean; message: string }>(`/inspection-items/${id}`),
};

export default inspectionItemService;
