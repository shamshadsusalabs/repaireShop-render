import { create } from 'zustand';
import vendorAuthService, { type VendorUser } from '../services/vendorAuthService';

interface VendorAuthState {
    // State
    user: VendorUser | null;
    accessToken: string | null;
    refreshToken: string | null;
    isLoggedIn: boolean;
    loading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<boolean>;
    register: (data: { name: string; email: string; password: string; phone?: string; gstNumber?: string; companyName?: string; address?: string }) => Promise<boolean>;
    logout: () => Promise<void>;
    loadFromStorage: () => void;
    clearError: () => void;
    getMe: () => Promise<void>;
}

const useVendorAuthStore = create<VendorAuthState>((set, get) => ({
    // Initial state
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoggedIn: false,
    loading: false,
    error: null,

    // Load auth state from localStorage on app start
    loadFromStorage: () => {
        const accessToken = localStorage.getItem('vendorAccessToken');
        const refreshToken = localStorage.getItem('vendorRefreshToken');
        const userStr = localStorage.getItem('vendorUser');

        if (accessToken && refreshToken && userStr) {
            try {
                const user = JSON.parse(userStr) as VendorUser;
                set({
                    user,
                    accessToken,
                    refreshToken,
                    isLoggedIn: true,
                });
            } catch {
                localStorage.removeItem('vendorAccessToken');
                localStorage.removeItem('vendorRefreshToken');
                localStorage.removeItem('vendorUser');
            }
        }
    },

    // Login
    login: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await vendorAuthService.login({ email, password });
            const { user, accessToken, refreshToken } = res.data;

            localStorage.setItem('vendorAccessToken', accessToken);
            localStorage.setItem('vendorRefreshToken', refreshToken);
            localStorage.setItem('vendorUser', JSON.stringify(user));

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

    // Register
    register: async (data) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await vendorAuthService.register(data);
            const { user, accessToken, refreshToken } = res.data;

            localStorage.setItem('vendorAccessToken', accessToken);
            localStorage.setItem('vendorRefreshToken', refreshToken);
            localStorage.setItem('vendorUser', JSON.stringify(user));

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
                err.response?.data?.message || err.message || 'Registration failed';
            set({ loading: false, error: message });
            return false;
        }
    },

    // Logout
    logout: async () => {
        try {
            if (get().accessToken) {
                await vendorAuthService.logout();
            }
        } catch {
            // Even if server logout fails, clear locally
        }

        localStorage.removeItem('vendorAccessToken');
        localStorage.removeItem('vendorRefreshToken');
        localStorage.removeItem('vendorUser');

        set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoggedIn: false,
            loading: false,
            error: null,
        });
    },

    // Get current vendor profile
    getMe: async () => {
        try {
            const { data: res } = await vendorAuthService.getMe();
            const user = res.data;
            localStorage.setItem('vendorUser', JSON.stringify(user));
            set({ user });
        } catch {
            // Token might be invalid
        }
    },

    // Clear error
    clearError: () => set({ error: null }),
}));

export default useVendorAuthStore;
