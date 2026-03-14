import api from './api';

export interface LoginPayload {
    email: string;
    password: string;
    role?: string;
}

const authService = {
    // Mechanic login via mechanic-auth
    mechanicLogin: (payload: LoginPayload) => api.post('/mechanic-auth/login', payload),

    // Driver login via user auth (driver is a User role)
    driverLogin: (payload: LoginPayload) => api.post('/auth/login', payload),

    // Manager login via user auth (manager is a User role)
    managerLogin: (payload: LoginPayload) => api.post('/auth/login', payload),

    logout: () => api.post('/mechanic-auth/logout'),

    // Manager logout uses user auth
    managerLogout: () => api.post('/auth/logout'),

    getMe: () => api.get('/mechanic-auth/me'),

    refreshToken: (refreshToken: string) =>
        api.post('/mechanic-auth/refresh-token', { refreshToken }),
};

export default authService;
