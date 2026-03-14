import { create } from 'zustand';
import inspectionItemService, { type CreateInspectionItemPayload, type UpdateInspectionItemPayload } from '../services/inspectionItemService';
import type { InspectionItem } from '../../types';

interface InspectionItemState {
    items: InspectionItem[];
    loading: boolean;
    error: string | null;

    fetchItems: () => Promise<void>;
    createItem: (payload: CreateInspectionItemPayload) => Promise<InspectionItem | null>;
    updateItem: (id: string, payload: UpdateInspectionItemPayload) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
    clearError: () => void;
}

const useInspectionItemStore = create<InspectionItemState>((set) => ({
    items: [],
    loading: false,
    error: null,

    fetchItems: async () => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await inspectionItemService.getAll();
            set({ items: res.data, loading: false });
        } catch (err: any) {
            set({ error: err.response?.data?.message || 'Failed to fetch items', loading: false });
        }
    },

    createItem: async (payload) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await inspectionItemService.create(payload);
            set((state) => ({ items: [...state.items, res.data], loading: false }));
            return res.data;
        } catch (err: any) {
            set({ error: err.response?.data?.message || 'Failed to create item', loading: false });
            throw err;
        }
    },

    updateItem: async (id, payload) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await inspectionItemService.update(id, payload);
            set((state) => ({
                items: state.items.map((item) => (item._id === id ? res.data : item)),
                loading: false,
            }));
        } catch (err: any) {
            set({ error: err.response?.data?.message || 'Failed to update item', loading: false });
            throw err;
        }
    },

    deleteItem: async (id) => {
        set({ loading: true, error: null });
        try {
            await inspectionItemService.delete(id);
            set((state) => ({
                items: state.items.filter((item) => item._id !== id),
                loading: false,
            }));
        } catch (err: any) {
            set({ error: err.response?.data?.message || 'Failed to delete item', loading: false });
            throw err;
        }
    },

    clearError: () => set({ error: null }),
}));

export default useInspectionItemStore;
