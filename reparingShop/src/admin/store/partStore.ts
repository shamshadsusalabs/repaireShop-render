import { create } from 'zustand';
import partService, { type Part, type InventoryStats, type BulkUploadResult } from '../services/partService';

interface PartState {
    // State
    parts: Part[];
    stats: InventoryStats | null;
    loading: boolean;
    uploading: boolean;
    error: string | null;

    // Actions
    fetchParts: (params?: Record<string, string>) => Promise<void>;
    fetchStats: () => Promise<void>;
    createPart: (data: Record<string, unknown>) => Promise<boolean>;
    updatePart: (id: string, data: Record<string, unknown>) => Promise<boolean>;
    deletePart: (id: string) => Promise<boolean>;
    uploadExcel: (file: File) => Promise<BulkUploadResult | null>;
    downloadTemplate: () => Promise<void>;
    clearError: () => void;
}

const usePartStore = create<PartState>((set) => ({
    // Initial state
    parts: [],
    stats: null,
    loading: false,
    uploading: false,
    error: null,

    // Fetch all parts
    fetchParts: async (params) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await partService.getAllParts(params);
            set({ parts: res.data, loading: false });
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Failed to fetch parts';
            set({ loading: false, error: message });
        }
    },

    // Fetch inventory stats
    fetchStats: async () => {
        try {
            const { data: res } = await partService.getStats();
            set({ stats: res.data });
        } catch (err: any) {
            console.error('Failed to fetch stats:', err);
        }
    },

    // Create a new part
    createPart: async (data) => {
        set({ loading: true, error: null });
        try {
            await partService.createPart(data as any);
            set({ loading: false });
            return true;
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Failed to create part';
            set({ loading: false, error: message });
            return false;
        }
    },

    // Update a part
    updatePart: async (id, data) => {
        set({ loading: true, error: null });
        try {
            await partService.updatePart(id, data as any);
            set({ loading: false });
            return true;
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Failed to update part';
            set({ loading: false, error: message });
            return false;
        }
    },

    // Delete a part
    deletePart: async (id) => {
        set({ loading: true, error: null });
        try {
            await partService.deletePart(id);
            set({ loading: false });
            return true;
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Failed to delete part';
            set({ loading: false, error: message });
            return false;
        }
    },

    // Upload Excel
    uploadExcel: async (file) => {
        set({ uploading: true, error: null });
        try {
            const { data: res } = await partService.uploadExcel(file);
            set({ uploading: false });
            return res.data;
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Failed to upload file';
            set({ uploading: false, error: message });
            return null;
        }
    },

    // Download template
    downloadTemplate: async () => {
        try {
            const response = await partService.downloadTemplate();
            const blob = new Blob([response.data as any], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'parts_template.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error('Failed to download template:', err);
        }
    },

    // Clear error
    clearError: () => set({ error: null }),
}));

export default usePartStore;
