import { create } from 'zustand';
import mechanicApiService, {
    toFrontendMechanic,
    type CreateMechanicPayload,
    type UpdateMechanicPayload,
    type MechanicFromAPI,
} from '../services/mechanicService';
import type { Mechanic } from '../../types';

interface MechanicState {
    // State
    mechanics: Mechanic[];
    mechanicsRaw: MechanicFromAPI[];
    loading: boolean;       // true only on first fetch (when store is empty)
    refreshing: boolean;    // true on background re-fetches
    hasFetched: boolean;    // tracks if initial fetch has happened
    error: string | null;

    // Actions
    fetchMechanics: (params?: { available?: string; search?: string }) => Promise<void>;
    createMechanic: (payload: CreateMechanicPayload) => Promise<boolean>;
    updateMechanic: (id: string, payload: UpdateMechanicPayload) => Promise<boolean>;
    deleteMechanic: (id: string) => Promise<boolean>;
    clearError: () => void;
}

const useMechanicStore = create<MechanicState>((set, get) => ({
    // Initial State
    mechanics: [],
    mechanicsRaw: [],
    loading: false,
    refreshing: false,
    hasFetched: false,
    error: null,

    // Fetch all mechanics — stale-while-revalidate
    fetchMechanics: async (params) => {
        const { hasFetched, mechanicsRaw } = get();

        // First time → show loading spinner
        // Already have data → just refresh in background (no spinner)
        if (!hasFetched || mechanicsRaw.length === 0) {
            set({ loading: true, error: null });
        } else {
            set({ refreshing: true, error: null });
        }

        try {
            const { data: res } = await mechanicApiService.getAll(params);
            set({
                mechanicsRaw: res.data,
                mechanics: res.data.map(toFrontendMechanic),
                loading: false,
                refreshing: false,
                hasFetched: true,
            });
        } catch (err: any) {
            set({
                loading: false,
                refreshing: false,
                error: err.response?.data?.message || 'Failed to fetch mechanics',
            });
        }
    },

    // Create mechanic
    createMechanic: async (payload) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await mechanicApiService.create(payload);
            set((state) => ({
                mechanicsRaw: [...state.mechanicsRaw, res.data],
                mechanics: [...state.mechanics, toFrontendMechanic(res.data)],
                loading: false,
            }));
            return true;
        } catch (err: any) {
            set({
                loading: false,
                error: err.response?.data?.message || 'Failed to create mechanic',
            });
            return false;
        }
    },

    // Update mechanic
    updateMechanic: async (id, payload) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await mechanicApiService.update(id, payload);
            set((state) => ({
                mechanicsRaw: state.mechanicsRaw.map((m) =>
                    m._id === id ? res.data : m
                ),
                mechanics: state.mechanicsRaw.map((m) =>
                    m._id === id ? toFrontendMechanic(res.data) : toFrontendMechanic(m)
                ),
                loading: false,
            }));
            return true;
        } catch (err: any) {
            set({
                loading: false,
                error: err.response?.data?.message || 'Failed to update mechanic',
            });
            return false;
        }
    },

    // Delete mechanic
    deleteMechanic: async (id) => {
        set({ loading: true, error: null });
        try {
            await mechanicApiService.delete(id);
            set((state) => ({
                mechanicsRaw: state.mechanicsRaw.filter((m) => m._id !== id),
                mechanics: state.mechanics.filter((m) => {
                    const raw = state.mechanicsRaw.find((r) => r._id === id);
                    return m.id !== raw?.mechanicId;
                }),
                loading: false,
            }));
            return true;
        } catch (err: any) {
            set({
                loading: false,
                error: err.response?.data?.message || 'Failed to delete mechanic',
            });
            return false;
        }
    },

    clearError: () => set({ error: null }),
}));

export default useMechanicStore;
