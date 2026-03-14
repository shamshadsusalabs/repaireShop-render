import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Job } from '../types';

const STORAGE_KEY = 'autofix_jobs';

interface JobContextType {
    jobs: Job[];
    addJob: (job: Job) => void;
    updateJob: (jobId: string, updates: Partial<Job>) => void;
    getJobById: (jobId: string) => Job | undefined;
    getNextJobId: () => string;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

function loadJobs(): Job[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch {
        // ignore parse errors
    }
    return [];
}

function saveJobs(jobs: Job[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

export function JobProvider({ children }: { children: ReactNode }) {
    const [jobs, setJobs] = useState<Job[]>(loadJobs);

    // Sync to localStorage whenever jobs change
    useEffect(() => {
        saveJobs(jobs);
    }, [jobs]);

    const addJob = (job: Job) => {
        setJobs(prev => [job, ...prev]);
    };

    const updateJob = (jobId: string, updates: Partial<Job>) => {
        setJobs(prev =>
            prev.map(job => (job.jobId === jobId ? { ...job, ...updates } : job))
        );
    };

    const getJobById = (jobId: string) => {
        return jobs.find(job => job.jobId === jobId);
    };

    const getNextJobId = () => {
        const year = new Date().getFullYear();
        if (jobs.length === 0) {
            return `JOB-${year}-001`;
        }
        const maxNum = jobs.reduce((max, job) => {
            const parts = job.jobId.split('-');
            const num = parseInt(parts[2], 10);
            return num > max ? num : max;
        }, 0);
        return `JOB-${year}-${String(maxNum + 1).padStart(3, '0')}`;
    };

    return (
        <JobContext.Provider value={{ jobs, addJob, updateJob, getJobById, getNextJobId }}>
            {children}
        </JobContext.Provider>
    );
}

export function useJobs() {
    const context = useContext(JobContext);
    if (!context) {
        throw new Error('useJobs must be used within a JobProvider');
    }
    return context;
}
