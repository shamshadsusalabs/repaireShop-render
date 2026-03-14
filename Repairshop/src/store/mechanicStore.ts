import { create } from 'zustand';
import mechanicService from '../services/mechanicService';
import type { Mechanic } from '../types';

interface MechanicState {
    mechanics: Mechanic[];
    loading: boolean;
    error: string | null;
    fetchMechanics: () => Promise<void>;
}

const useMechanicStore = create<MechanicState>((set) => ({
    mechanics: [],
    loading: false,
    error: null,

    fetchMechanics: async () => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await mechanicService.getAll();
            set({ mechanics: res.data, loading: false });
        } catch (err: any) {
            set({
                error: err.response?.data?.message || 'Failed to fetch mechanics',
                loading: false,
            });
        }
    },
}));

export default useMechanicStore;
