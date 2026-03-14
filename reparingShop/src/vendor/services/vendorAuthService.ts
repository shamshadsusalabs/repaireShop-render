import vendorApi from './vendorApi';

export interface VendorLoginPayload {
    email: string;
    password: string;
}

export interface VendorRegisterPayload {
    name: string;
    email: string;
    password: string;
    phone?: string;
    gstNumber?: string;
    companyName?: string;
    address?: string;
}

export interface VendorUser {
    id: string;
    name: string;
    email: string;
    phone: string;
    gstNumber: string;
    companyName: string;
    address: string;
    role: string;
    avatar?: string;
}

export interface VendorAuthResponse {
    success: boolean;
    message: string;
    data: {
        user: VendorUser;
        accessToken: string;
        refreshToken: string;
    };
}

export interface VendorRefreshResponse {
    success: boolean;
    data: {
        accessToken: string;
        refreshToken: string;
    };
}

const vendorAuthService = {
    login: (payload: VendorLoginPayload) =>
        vendorApi.post<VendorAuthResponse>('/vendor-auth/login', payload),

    register: (payload: VendorRegisterPayload) =>
        vendorApi.post<VendorAuthResponse>('/vendor-auth/register', payload),

    refreshToken: (refreshToken: string) =>
        vendorApi.post<VendorRefreshResponse>('/vendor-auth/refresh-token', { refreshToken }),

    logout: () =>
        vendorApi.post('/vendor-auth/logout'),

    getMe: () =>
        vendorApi.get<{ success: boolean; data: VendorUser }>('/vendor-auth/me'),
};

export default vendorAuthService;
