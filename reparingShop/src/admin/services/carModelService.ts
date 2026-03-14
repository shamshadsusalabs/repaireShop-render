import api from './api';
import type { CarModel } from '../../types';

export interface CreateCarModelPayload {
    brand: string;
    modelName: string;
}

export interface UpdateCarModelPayload {
    brand?: string;
    modelName?: string;
}

const carModelService = {
    getAll: () =>
        api.get<{ success: boolean; count: number; data: CarModel[] }>('/car-models'),

    create: (payload: CreateCarModelPayload) =>
        api.post<{ success: boolean; data: CarModel }>('/car-models', payload),

    update: (id: string, payload: UpdateCarModelPayload) =>
        api.put<{ success: boolean; data: CarModel }>(`/car-models/${id}`, payload),

    delete: (id: string) =>
        api.delete<{ success: boolean; message: string }>(`/car-models/${id}`),
};

export default carModelService;
