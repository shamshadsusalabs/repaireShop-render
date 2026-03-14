import api from './api';

export interface UserFromAPI {
    _id: string;
    name: string;
    email: string;
    mobileNumber: string;
    role: 'admin' | 'manager' | 'store' | 'accountant' | 'driver' | 'receptionist';
    avatar: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUserPayload {
    name: string;
    email: string;
    mobileNumber: string;
    password: string;
    role: string;
    avatar?: string;
}

export interface UpdateUserPayload {
    name?: string;
    email?: string;
    mobileNumber?: string;
    password?: string;
    role?: string;
    avatar?: string;
    isActive?: boolean;
}

const userService = {
    getAll: (params?: { role?: string; search?: string }) =>
        api.get<{ success: boolean; count: number; data: UserFromAPI[] }>('/users', { params }),

    getById: (id: string) =>
        api.get<{ success: boolean; data: UserFromAPI }>(`/users/${id}`),

    create: (payload: CreateUserPayload) =>
        api.post<{ success: boolean; data: UserFromAPI }>('/users', payload),

    update: (id: string, payload: UpdateUserPayload) =>
        api.put<{ success: boolean; data: UserFromAPI }>(`/users/${id}`, payload),

    delete: (id: string) =>
        api.delete(`/users/${id}`),
};

export default userService;
