import { create } from 'zustand';
import jobApiService from '../services/jobService';
import type { Job, InspectionResult, FaultyPart } from '../../types';

interface JobState {
    // State
    jobs: Job[];
    currentJob: Job | null;
    customerHistory: {
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
    loading: boolean;       // true only on first fetch
    refreshing: boolean;    // true on background re-fetches
    hasFetched: boolean;
    error: string | null;

    // Actions
    fetchJobs: (params?: { status?: string; search?: string }) => Promise<void>;
    fetchJobById: (jobId: string) => Promise<void>;
    searchHistory: (query: string) => Promise<void>;
    createJob: (payload: {
        customerName: string;
        mobile: string;
        carModel: string;
        carNumber: string;
        kmDriven: number;
        jobType: string;
        location?: string;
        carImages?: File[];
    }) => Promise<Job | null>;
    updateJob: (jobId: string, updates: Partial<Job>) => Promise<void>;
    assignMechanic: (jobId: string, mechanicId: string) => Promise<void>;
    saveInspection: (jobId: string, results: InspectionResult[]) => Promise<void>;
    saveFaultyParts: (jobId: string, parts: FaultyPart[]) => Promise<void>;
    customerApproval: (jobId: string, approved: boolean) => Promise<void>;
    saveRepairCost: (jobId: string, parts: FaultyPart[]) => Promise<void>;
    completeJob: (jobId: string) => Promise<void>;
    deleteJob: (jobId: string) => Promise<void>;
    clearError: () => void;
    getJobById: (jobId: string) => Job | undefined;
}

const useJobStore = create<JobState>((set, get) => ({
    // Initial State
    jobs: [],
    currentJob: null,
    customerHistory: { customer: null, history: [] },
    loading: false,
    refreshing: false,
    hasFetched: false,
    error: null,

    // Fetch all jobs — stale-while-revalidate
    fetchJobs: async (params) => {
        const { hasFetched, jobs } = get();

        // First time → show loading spinner
        // Already have data → just refresh in background
        if (!hasFetched || jobs.length === 0) {
            set({ loading: true, error: null });
        } else {
            set({ refreshing: true, error: null });
        }

        try {
            const { data: res } = await jobApiService.getAll(params);
            set({
                jobs: res.data,
                loading: false,
                refreshing: false,
                hasFetched: true,
            });
        } catch (err: any) {
            set({
                loading: false,
                refreshing: false,
                error: err.response?.data?.message || 'Failed to fetch jobs',
            });
        }
    },

    // Search History
    searchHistory: async (query: string) => {
        try {
            const { data: res } = await jobApiService.getHistory(query);
            set({ customerHistory: res.data });
        } catch (err: any) {
            console.error(err);
        }
    },

    // Fetch single job — show cached from jobs list instantly, then fetch fresh
    fetchJobById: async (jobId: string) => {
        // Immediately show cached version if available in jobs list
        const cached = get().jobs.find((j) => j.jobId === jobId);
        if (cached) {
            set({ currentJob: cached, loading: false });
        } else {
            set({ loading: true, error: null });
        }

        // Always fetch fresh data in background
        try {
            const { data: res } = await jobApiService.getById(jobId);
            set((state) => ({
                currentJob: res.data,
                // Also update in the jobs list if present
                jobs: state.jobs.map((j) => (j.jobId === jobId ? res.data : j)),
                loading: false,
            }));
        } catch (err: any) {
            // Only show error if we didn't have cached data
            if (!cached) {
                set({
                    loading: false,
                    error: err.response?.data?.message || 'Failed to fetch job',
                });
            }
        }
    },

    // Create job
    createJob: async (payload) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await jobApiService.create(payload);
            set((state) => ({
                jobs: [res.data, ...state.jobs],
                loading: false,
            }));
            return res.data;
        } catch (err: any) {
            set({
                loading: false,
                error: err.response?.data?.message || 'Failed to create job',
            });
            return null;
        }
    },

    // Update job
    updateJob: async (jobId, updates) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await jobApiService.update(jobId, updates);
            set((state) => ({
                jobs: state.jobs.map((j) => (j.jobId === jobId ? res.data : j)),
                currentJob: state.currentJob?.jobId === jobId ? res.data : state.currentJob,
                loading: false,
            }));
        } catch (err: any) {
            set({
                loading: false,
                error: err.response?.data?.message || 'Failed to update job',
            });
        }
    },

    // Assign mechanic
    assignMechanic: async (jobId, mechanicId) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await jobApiService.assignMechanic(jobId, mechanicId);
            set((state) => ({
                jobs: state.jobs.map((j) => (j.jobId === jobId ? res.data : j)),
                currentJob: state.currentJob?.jobId === jobId ? res.data : state.currentJob,
                loading: false,
            }));
        } catch (err: any) {
            set({
                loading: false,
                error: err.response?.data?.message || 'Failed to assign mechanic',
            });
            throw err;
        }
    },

    // Save inspection
    saveInspection: async (jobId, results) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await jobApiService.saveInspection(jobId, results);
            set((state) => ({
                jobs: state.jobs.map((j) => (j.jobId === jobId ? res.data : j)),
                currentJob: state.currentJob?.jobId === jobId ? res.data : state.currentJob,
                loading: false,
            }));
        } catch (err: any) {
            set({
                loading: false,
                error: err.response?.data?.message || 'Failed to save inspection',
            });
            throw err;
        }
    },

    // Save faulty parts
    saveFaultyParts: async (jobId, parts) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await jobApiService.saveFaultyParts(jobId, parts);
            set((state) => ({
                jobs: state.jobs.map((j) => (j.jobId === jobId ? res.data : j)),
                currentJob: state.currentJob?.jobId === jobId ? res.data : state.currentJob,
                loading: false,
            }));
        } catch (err: any) {
            set({
                loading: false,
                error: err.response?.data?.message || 'Failed to save faulty parts',
            });
            throw err;
        }
    },

    // Customer approval
    customerApproval: async (jobId, approved) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await jobApiService.customerApproval(jobId, approved);
            set((state) => ({
                jobs: state.jobs.map((j) => (j.jobId === jobId ? res.data : j)),
                currentJob: state.currentJob?.jobId === jobId ? res.data : state.currentJob,
                loading: false,
            }));
        } catch (err: any) {
            set({
                loading: false,
                error: err.response?.data?.message || 'Failed to update approval',
            });
            throw err;
        }
    },

    // Save repair cost
    saveRepairCost: async (jobId, parts) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await jobApiService.saveRepairCost(jobId, parts);
            set((state) => ({
                jobs: state.jobs.map((j) => (j.jobId === jobId ? res.data : j)),
                currentJob: state.currentJob?.jobId === jobId ? res.data : state.currentJob,
                loading: false,
            }));
        } catch (err: any) {
            set({
                loading: false,
                error: err.response?.data?.message || 'Failed to save repair cost',
            });
            throw err;
        }
    },

    // Complete job
    completeJob: async (jobId) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await jobApiService.completeJob(jobId);
            set((state) => ({
                jobs: state.jobs.map((j) => (j.jobId === jobId ? res.data : j)),
                currentJob: state.currentJob?.jobId === jobId ? res.data : state.currentJob,
                loading: false,
            }));
        } catch (err: any) {
            set({
                loading: false,
                error: err.response?.data?.message || 'Failed to complete job',
            });
            throw err;
        }
    },

    // Delete job
    deleteJob: async (jobId) => {
        set({ loading: true, error: null });
        try {
            await jobApiService.deleteJob(jobId);
            set((state) => ({
                jobs: state.jobs.filter((j) => j.jobId !== jobId),
                currentJob: state.currentJob?.jobId === jobId ? null : state.currentJob,
                loading: false,
            }));
        } catch (err: any) {
            set({
                loading: false,
                error: err.response?.data?.message || 'Failed to delete job',
            });
            throw err;
        }
    },

    // Get job by ID from local state (sync — instant, no API call)
    getJobById: (jobId: string) => {
        return get().jobs.find((j) => j.jobId === jobId);
    },

    clearError: () => set({ error: null }),
}));

export default useJobStore;
