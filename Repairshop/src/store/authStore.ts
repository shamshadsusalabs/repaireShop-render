import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';
import type { AppUser } from '../types';

type AppRole = 'mechanic' | 'driver' | 'manager';

interface AuthState {
    user: AppUser | null;
    accessToken: string | null;
    appRole: AppRole | null;
    isLoggedIn: boolean;
    loading: boolean;
    initialLoading: boolean;
    error: string | null;

    login: (email: string, password: string, role: AppRole) => Promise<boolean>;
    logout: () => Promise<void>;
    loadFromStorage: () => Promise<void>;
    clearError: () => void;
}

const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    accessToken: null,
    appRole: null,
    isLoggedIn: false,
    loading: false,
    initialLoading: true,
    error: null,

    loadFromStorage: async () => {
        try {
            const [[, token], [, refresh], [, userData], [, role]] =
                await AsyncStorage.multiGet(['accessToken', 'refreshToken', 'user', 'appRole']);

            if (token && refresh && userData) {
                const parsedUser = JSON.parse(userData) as AppUser;
                set({
                    user: parsedUser,
                    accessToken: token,
                    appRole: (role as AppRole) || parsedUser.role,
                    isLoggedIn: true,
                    initialLoading: false,
                });
            } else {
                set({ initialLoading: false });
            }
        } catch {
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user', 'appRole']);
            set({ initialLoading: false });
        }
    },

    login: async (email: string, password: string, role: AppRole) => {
        set({ loading: true, error: null });
        try {
            let res: any;

            if (role === 'mechanic') {
                // Mechanic uses mechanic-auth endpoint
                const response = await authService.mechanicLogin({ email, password });
                res = response.data;
            } else if (role === 'manager') {
                // Manager uses user auth endpoint
                const response = await authService.managerLogin({ email, password, role: 'manager' });
                res = response.data;
            } else {
                // Driver uses user auth endpoint with role validation
                const response = await authService.driverLogin({ email, password, role: 'driver' });
                res = response.data;
            }

            const { user: userData, accessToken: at, refreshToken: rt } = res.data;

            await AsyncStorage.setItem('accessToken', at);
            await AsyncStorage.setItem('refreshToken', rt);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            await AsyncStorage.setItem('appRole', role);

            set({
                user: userData,
                accessToken: at,
                appRole: role,
                isLoggedIn: true,
                loading: false,
                error: null,
            });
            return true;
        } catch (err: any) {
            const message =
                err.response?.data?.message || err.message || 'Login failed';
            set({ error: message, loading: false });
            return false;
        }
    },

    logout: async () => {
        try {
            const { accessToken, appRole } = get();
            if (accessToken) {
                if (appRole === 'manager') {
                    await authService.managerLogout();
                } else {
                    await authService.logout();
                }
            }
        } catch {
            // Even if server logout fails, clear locally
        }

        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user', 'appRole']);
        set({
            user: null,
            accessToken: null,
            appRole: null,
            isLoggedIn: false,
            error: null,
        });
    },

    clearError: () => set({ error: null }),
}));

export default useAuthStore;
