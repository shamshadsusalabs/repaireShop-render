import { create } from 'zustand';
import carModelService, { type CreateCarModelPayload, type UpdateCarModelPayload } from '../services/carModelService';
import type { CarModel } from '../../types';

interface CarModelState {
    models: CarModel[];
    loading: boolean;
    error: string | null;

    fetchModels: () => Promise<void>;
    createModel: (payload: CreateCarModelPayload) => Promise<CarModel | null>;
    updateModel: (id: string, payload: UpdateCarModelPayload) => Promise<void>;
    deleteModel: (id: string) => Promise<void>;
    clearError: () => void;
}

const useCarModelStore = create<CarModelState>((set) => ({
    models: [],
    loading: false,
    error: null,

    fetchModels: async () => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await carModelService.getAll();
            set({ models: res.data, loading: false });
        } catch (err: any) {
            set({ error: err.response?.data?.message || 'Failed to fetch car models', loading: false });
        }
    },

    createModel: async (payload) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await carModelService.create(payload);
            set((state) => ({ models: [...state.models, res.data], loading: false }));
            return res.data;
        } catch (err: any) {
            set({ error: err.response?.data?.message || 'Failed to create car model', loading: false });
            throw err;
        }
    },

    updateModel: async (id, payload) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await carModelService.update(id, payload);
            set((state) => ({
                models: state.models.map((model) => (model._id === id ? res.data : model)),
                loading: false,
            }));
        } catch (err: any) {
            set({ error: err.response?.data?.message || 'Failed to update car model', loading: false });
            throw err;
        }
    },

    deleteModel: async (id) => {
        set({ loading: true, error: null });
        try {
            await carModelService.delete(id);
            set((state) => ({
                models: state.models.filter((model) => model._id !== id),
                loading: false,
            }));
        } catch (err: any) {
            set({ error: err.response?.data?.message || 'Failed to delete car model', loading: false });
            throw err;
        }
    },

    clearError: () => set({ error: null }),
}));

export default useCarModelStore;
