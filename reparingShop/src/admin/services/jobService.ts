import api from './api';
import type { Job, Driver, InspectionResult, FaultyPart } from '../../types';

export interface DashboardStats {
    totalJobs: number;
    pending: number;
    inProgress: number;
    completed: number;
}

export interface CreateJobPayload {
    customerName: string;
    mobile: string;
    carModel: string;
    carNumber: string;
    kmDriven: number;
    carImages?: File[];
}

const jobService = {
    // Get dashboard stats
    getStats: () =>
        api.get<{ success: boolean; data: DashboardStats }>('/jobs/stats'),

    // Get all jobs
    getAll: (params?: { status?: string; search?: string }) =>
        api.get<{ success: boolean; count: number; data: Job[] }>('/jobs', { params }),

    // Search job history
    getHistory: (query: string) =>
        api.get<{
            success: boolean;
            data: {
                customer: {
                    customerName: string;
                    mobile: string;
                    carModel: string;
                    carNumber: string;
                    kmDriven: number;
                } | null;
                history: Array<{
                    jobId: string;
                    date: string;
                    carModel: string;
                    status: string;
                    grandTotal: number;
                }>;
            };
        }>('/jobs/history', { params: { query } }),

    // Get single job
    getById: (jobId: string) =>
        api.get<{ success: boolean; data: Job }>(`/jobs/${jobId}`),

    // Create job (with optional image upload)
    create: (payload: CreateJobPayload) => {
        const formData = new FormData();
        formData.append('customerName', payload.customerName);
        formData.append('mobile', payload.mobile);
        formData.append('carModel', payload.carModel);
        formData.append('carNumber', payload.carNumber);
        formData.append('kmDriven', String(payload.kmDriven));
        if (payload.carImages && payload.carImages.length > 0) {
            payload.carImages.forEach((file) => {
                formData.append('carImages', file);
            });
        }
        return api.post<{ success: boolean; data: Job }>('/jobs', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    // Update job
    update: (jobId: string, updates: Partial<Job>) =>
        api.put<{ success: boolean; data: Job }>(`/jobs/${jobId}`, updates),

    // Assign mechanic
    assignMechanic: (jobId: string, mechanicId: string) =>
        api.put<{ success: boolean; data: Job }>(`/jobs/${jobId}/assign`, { mechanicId }),

    // Save inspection results
    saveInspection: (jobId: string, inspectionResults: InspectionResult[]) =>
        api.put<{ success: boolean; data: Job }>(`/jobs/${jobId}/inspection`, { inspectionResults }),

    // Save faulty parts
    saveFaultyParts: (jobId: string, faultyParts: FaultyPart[]) =>
        api.put<{ success: boolean; data: Job }>(`/jobs/${jobId}/faults`, { faultyParts }),

    // Customer approval
    customerApproval: (jobId: string, approved: boolean) =>
        api.put<{ success: boolean; data: Job }>(`/jobs/${jobId}/approval`, { approved }),

    // Save repair costs
    saveRepairCost: (jobId: string, faultyParts: FaultyPart[]) =>
        api.put<{ success: boolean; data: Job }>(`/jobs/${jobId}/repair-cost`, { faultyParts }),

    // Complete job
    completeJob: (jobId: string) =>
        api.put<{ success: boolean; data: Job }>(`/jobs/${jobId}/complete`),

    // Delete job
    deleteJob: (jobId: string) =>
        api.delete(`/jobs/${jobId}`),

    // Store: Get approved jobs needing parts
    getApprovedForParts: () =>
        api.get<{ success: boolean; count: number; data: Job[] }>('/jobs/approved-for-parts'),

    // Store: Issue parts from inventory to a job
    issueParts: (jobId: string, parts: Array<{ partId: string; quantityIssued: number }>) =>
        api.put(`/jobs/${jobId}/issue-parts`, { parts }),

    // Store: Mark job as ready for repair
    markReadyForRepair: (jobId: string) =>
        api.put<{ success: boolean; data: Job }>(`/jobs/${jobId}/ready-for-repair`),

    // Receptionist: Get all active drivers
    getDrivers: () =>
        api.get<{ success: boolean; count: number; data: Driver[] }>('/jobs/drivers'),

    // Receptionist: Assign driver to a job
    assignDriver: (jobId: string, driverId: string, driverTask: 'Pickup' | 'Drop') =>
        api.put<{ success: boolean; data: Job }>(`/jobs/${jobId}/assign-driver`, { driverId, driverTask }),

    // Trigger Drop/Delivery WhatsApp
    sendDropWhatsApp: (jobId: string, variables: string[]) =>
        api.post<{ success: boolean; message: string }>(`/jobs/${jobId}/send-drop-whatsapp`, { variables }),
};

export default jobService;
