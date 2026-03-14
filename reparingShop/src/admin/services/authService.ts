import api from './api';

export interface LoginPayload {
    email: string;
    password: string;
    role: string;
}

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    role?: string;
}

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user: AuthUser;
        accessToken: string;
        refreshToken: string;
    };
}

export interface RefreshResponse {
    success: boolean;
    data: {
        accessToken: string;
        refreshToken: string;
    };
}

const authService = {
    login: (payload: LoginPayload) =>
        api.post<AuthResponse>('/auth/login', payload),

    register: (payload: RegisterPayload) =>
        api.post<AuthResponse>('/auth/register', payload),

    refreshToken: (refreshToken: string) =>
        api.post<RefreshResponse>('/auth/refresh-token', { refreshToken }),

    logout: () =>
        api.post('/auth/logout'),

    getMe: () =>
        api.get<{ success: boolean; data: AuthUser }>('/auth/me'),
};

export default authService;
