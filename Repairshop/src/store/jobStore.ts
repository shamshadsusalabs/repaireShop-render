import { create } from 'zustand';
import jobService from '../services/jobService';
import type { Job, InspectionResult, FaultyPart } from '../types';
import type { CreateJobPayload } from '../services/jobService';

interface CustomerHistory {
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
}

interface JobState {
    jobs: Job[];
    currentJob: Job | null;
    customerHistory: CustomerHistory;
    loading: boolean;
    error: string | null;

    fetchJobs: () => Promise<void>;
    fetchJobById: (jobId: string) => Promise<void>;
    saveInspection: (
        jobId: string,
        inspectionResults: InspectionResult[],
    ) => Promise<void>;
    createJob: (payload: CreateJobPayload) => Promise<Job | null>;
    clearCurrentJob: () => void;

    // Manager actions
    searchHistory: (query: string) => Promise<void>;
    assignMechanic: (jobId: string, mechanicId: string) => Promise<void>;
    saveFaultyParts: (jobId: string, parts: FaultyPart[]) => Promise<void>;
    customerApproval: (jobId: string, approved: boolean) => Promise<void>;
    saveRepairCost: (jobId: string, parts: FaultyPart[]) => Promise<void>;
    completeJob: (jobId: string) => Promise<void>;
}

const useJobStore = create<JobState>((set, get) => ({
    jobs: [],
    currentJob: null,
    customerHistory: { customer: null, history: [] },
    loading: false,
    error: null,

    fetchJobs: async () => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await jobService.getAll();
            set({ jobs: res.data, loading: false });
        } catch (err: any) {
            set({
                error: err.response?.data?.message || 'Failed to fetch jobs',
                loading: false,
            });
        }
    },

    fetchJobById: async (jobId: string) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await jobService.getById(jobId);
            set({ currentJob: res.data, loading: false });
        } catch (err: any) {
            set({
                error: err.response?.data?.message || 'Failed to fetch job',
                loading: false,
            });
        }
    },

    saveInspection: async (
        jobId: string,
        inspectionResults: InspectionResult[],
    ) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await jobService.saveInspection(
                jobId,
                inspectionResults,
            );
            set({ currentJob: res.data, loading: false });
        } catch (err: any) {
            set({
                error: err.response?.data?.message || 'Failed to save inspection',
                loading: false,
            });
            throw err;
        }
    },

    createJob: async (payload: CreateJobPayload) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await jobService.createJob(payload);
            set((state) => ({
                jobs: [res.data, ...state.jobs],
                loading: false,
            }));
            return res.data;
        } catch (err: any) {
            set({
                error: err.response?.data?.message || 'Failed to create job',
                loading: false,
            });
            return null;
        }
    },

    clearCurrentJob: () => set({ currentJob: null }),

    // ─── Manager Actions ─────────────────────────────────────────

    searchHistory: async (query: string) => {
        try {
            const { data: res } = await jobService.getHistory(query);
            set({ customerHistory: res.data });
        } catch (err: any) {
            console.error('Search history error:', err);
        }
    },

    assignMechanic: async (jobId: string, mechanicId: string) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await jobService.assignMechanic(jobId, mechanicId);
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

    saveFaultyParts: async (jobId: string, parts: FaultyPart[]) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await jobService.saveFaultyParts(jobId, parts);
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

    customerApproval: async (jobId: string, approved: boolean) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await jobService.customerApproval(jobId, approved);
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

    saveRepairCost: async (jobId: string, parts: FaultyPart[]) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await jobService.saveRepairCost(jobId, parts);
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

    completeJob: async (jobId: string) => {
        set({ loading: true, error: null });
        try {
            const { data: res } = await jobService.completeJob(jobId);
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
}));

export default useJobStore;
