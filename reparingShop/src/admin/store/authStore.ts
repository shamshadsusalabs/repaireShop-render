import { create } from 'zustand';
import authApiService, { type AuthUser } from '../services/authService';

interface AuthState {
    // State
    user: AuthUser | null;
    accessToken: string | null;
    refreshToken: string | null;
    isLoggedIn: boolean;
    loading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string, role: string) => Promise<boolean>;
    logout: () => Promise<void>;
    loadFromStorage: () => void;
    clearError: () => void;
    getMe: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set, get) => ({
    // Initial state
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoggedIn: false,
    loading: false,
    error: null,

    // Load auth state from localStorage on app start
    loadFromStorage: () => {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const userStr = localStorage.getItem('user');

        if (accessToken && refreshToken && userStr) {
            try {
                const user = JSON.parse(userStr) as AuthUser;
                set({
                    user,
                    accessToken,
                    refreshToken,
                    isLoggedIn: true,
                });
            } catch {
                // Corrupted data, clear
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
            }
        }
    },

    // Login
    login: async (email: string, password: string, role: string) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await authApiService.login({ email, password, role });
            const { user, accessToken, refreshToken } = res.data;

            // Store in localStorage
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));

            set({
                user,
                accessToken,
                refreshToken,
                isLoggedIn: true,
                loading: false,
                error: null,
            });

            return true;
        } catch (err: any) {
            const message =
                err.response?.data?.message || err.message || 'Login failed';
            set({ loading: false, error: message });
            return false;
        }
    },

    // Logout
    logout: async () => {
        try {
            // Call server logout to clear refresh token in DB
            if (get().accessToken) {
                await authApiService.logout();
            }
        } catch {
            // Even if server logout fails, clear locally
        }

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoggedIn: false,
            loading: false,
            error: null,
        });
    },

    // Get current user profile
    getMe: async () => {
        try {
            const { data: res } = await authApiService.getMe();
            const user = res.data;
            localStorage.setItem('user', JSON.stringify(user));
            set({ user });
        } catch {
            // Token might be invalid
        }
    },

    // Clear error
    clearError: () => set({ error: null }),
}));

export default useAuthStore;
