import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';
import type { MechanicUser } from '../types';

interface AuthContextType {
    user: MechanicUser | null;
    accessToken: string | null;
    isLoggedIn: boolean;
    loading: boolean;
    initialLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    accessToken: null,
    isLoggedIn: false,
    loading: false,
    initialLoading: true,
    error: null,
    login: async () => false,
    logout: async () => { },
    clearError: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<MechanicUser | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load auth state from AsyncStorage on mount
    useEffect(() => {
        const loadFromStorage = async () => {
            try {
                const [storedToken, storedRefresh, storedUser] =
                    await AsyncStorage.multiGet([
                        'accessToken',
                        'refreshToken',
                        'user',
                    ]);

                if (storedToken[1] && storedRefresh[1] && storedUser[1]) {
                    const parsedUser = JSON.parse(storedUser[1]) as MechanicUser;
                    setUser(parsedUser);
                    setAccessToken(storedToken[1]);
                    setIsLoggedIn(true);
                }
            } catch {
                // Corrupted data, clear
                await AsyncStorage.multiRemove([
                    'accessToken',
                    'refreshToken',
                    'user',
                ]);
            } finally {
                setInitialLoading(false);
            }
        };
        loadFromStorage();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data: res } = await authService.mechanicLogin({ email, password });
            const { user: userData, accessToken: at, refreshToken: rt } = res.data;

            await AsyncStorage.setItem('accessToken', at);
            await AsyncStorage.setItem('refreshToken', rt);
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            setAccessToken(at);
            setIsLoggedIn(true);
            setLoading(false);
            return true;
        } catch (err: any) {
            const message =
                err.response?.data?.message || err.message || 'Login failed';
            setError(message);
            setLoading(false);
            return false;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            if (accessToken) {
                await authService.logout();
            }
        } catch {
            // Even if server logout fails, clear locally
        }

        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        setUser(null);
        setAccessToken(null);
        setIsLoggedIn(false);
        setError(null);
    }, [accessToken]);

    const clearError = useCallback(() => setError(null), []);

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                isLoggedIn,
                loading,
                initialLoading,
                error,
                login,
                logout,
                clearError,
            }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

export default AuthContext;
