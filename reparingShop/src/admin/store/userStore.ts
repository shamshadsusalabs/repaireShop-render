import { create } from 'zustand';
import userApiService, {
    type CreateUserPayload,
    type UpdateUserPayload,
    type UserFromAPI,
} from '../services/userService';

interface UserState {
    users: UserFromAPI[];
    loading: boolean;       // true only on first fetch
    refreshing: boolean;    // true on background re-fetches
    hasFetched: boolean;
    error: string | null;

    fetchUsers: (params?: { role?: string; search?: string }) => Promise<void>;
    createUser: (payload: CreateUserPayload) => Promise<boolean>;
    updateUser: (id: string, payload: UpdateUserPayload) => Promise<boolean>;
    deleteUser: (id: string) => Promise<boolean>;
    clearError: () => void;
}

const useUserStore = create<UserState>((set, get) => ({
    users: [],
    loading: false,
    refreshing: false,
    hasFetched: false,
    error: null,

    fetchUsers: async (params) => {
        const { hasFetched, users } = get();

        if (!hasFetched || users.length === 0) {
            set({ loading: true, error: null });
        } else {
            set({ refreshing: true, error: null });
        }

        try {
            const { data: res } = await userApiService.getAll(params);
            set({
                users: res.data,
                loading: false,
                refreshing: false,
                hasFetched: true,
            });
        } catch (err: any) {
            set({
                loading: false,
                refreshing: false,
                error: err.response?.data?.message || 'Failed to fetch users',
            });
        }
    },

    createUser: async (payload) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await userApiService.create(payload);
            set((state) => ({
                users: [...state.users, res.data],
                loading: false,
            }));
            return true;
        } catch (err: any) {
            set({
                loading: false,
                error: err.response?.data?.message || 'Failed to create user',
            });
            return false;
        }
    },

    updateUser: async (id, payload) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await userApiService.update(id, payload);
            set((state) => ({
                users: state.users.map((u) => (u._id === id ? res.data : u)),
                loading: false,
            }));
            return true;
        } catch (err: any) {
            set({
                loading: false,
                error: err.response?.data?.message || 'Failed to update user',
            });
            return false;
        }
    },

    deleteUser: async (id) => {
        set({ loading: true, error: null });
        try {
            await userApiService.delete(id);
            set((state) => ({
                users: state.users.filter((u) => u._id !== id),
                loading: false,
            }));
            return true;
        } catch (err: any) {
            set({
                loading: false,
                error: err.response?.data?.message || 'Failed to delete user',
            });
            return false;
        }
    },

    clearError: () => set({ error: null }),
}));

export default useUserStore;
