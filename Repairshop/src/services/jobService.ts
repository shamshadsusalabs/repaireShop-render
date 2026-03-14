import api from './api';
import type { InspectionResult, FaultyPart } from '../types';

export interface CreateJobPayload {
    customerName: string;
    mobile: string;
    carModel: string;
    carNumber: string;
    kmDriven: number;
    jobType: 'Pickup' | 'Walk-in';
    location?: string;
    carImages?: Array<{
        uri: string;
        type: string;
        name: string;
    }>;
}

const jobService = {
    // Get all jobs
    getAll: (params?: { status?: string; search?: string }) =>
        api.get('/jobs', { params }),

    // Get single job by jobId
    getById: (jobId: string) => api.get(`/jobs/${jobId}`),

    // Save inspection results (mechanic)
    saveInspection: (jobId: string, inspectionResults: InspectionResult[]) =>
        api.put(`/jobs/${jobId}/inspection`, { inspectionResults }),

    // Create a new job (driver / manager)
    createJob: (payload: CreateJobPayload) => {
        if (payload.carImages && payload.carImages.length > 0) {
            const formData = new FormData();
            formData.append('customerName', payload.customerName);
            formData.append('mobile', payload.mobile);
            formData.append('carModel', payload.carModel);
            formData.append('carNumber', payload.carNumber);
            formData.append('kmDriven', String(payload.kmDriven));
            formData.append('jobType', payload.jobType);
            if (payload.location) {
                formData.append('location', payload.location);
            }
            // Append multiple images
            payload.carImages.forEach((image) => {
                formData.append('carImages', image as any);
            });
            return api.post('/jobs', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        }
        const { carImages, ...rest } = payload;
        return api.post('/jobs', rest);
    },

    // ─── Manager endpoints ───────────────────────────────────────

    // Search customer history
    getHistory: (query: string) =>
        api.get('/jobs/history', { params: { query } }),

    // Assign mechanic to job
    assignMechanic: (jobId: string, mechanicId: string) =>
        api.put(`/jobs/${jobId}/assign`, { mechanicId }),

    // Save faulty parts
    saveFaultyParts: (jobId: string, faultyParts: FaultyPart[]) =>
        api.put(`/jobs/${jobId}/faults`, { faultyParts }),

    // Customer approval
    customerApproval: (jobId: string, approved: boolean) =>
        api.put(`/jobs/${jobId}/approval`, { approved }),

    // Save repair costs
    saveRepairCost: (jobId: string, faultyParts: FaultyPart[]) =>
        api.put(`/jobs/${jobId}/repair-cost`, { faultyParts }),

    // Complete job
    completeJob: (jobId: string) =>
        api.put(`/jobs/${jobId}/complete`),
};

export default jobService;
