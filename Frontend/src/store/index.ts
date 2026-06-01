import { create } from 'zustand';

export interface ValidationTask {
    id: string;
    model: string;
    subject: string;
    confidence: number;
    status: 'Pending' | 'Approved' | 'Rejected';
}

interface AppState {
    activeTrainingJobs: string[];
    addTrainingJob: (jobId: string) => void;
    removeTrainingJob: (jobId: string) => void;
    isSyncing: boolean;
    setSyncing: (status: boolean) => void;
    globalAlert: string | null;
    setGlobalAlert: (alert: string | null) => void;
    validationTasks: ValidationTask[];
    setValidationTasks: (tasks: ValidationTask[]) => void;
    updateValidationTaskStatus: (id: string, status: 'Pending' | 'Approved' | 'Rejected') => void;
}

export const useAppStore = create<AppState>((set) => ({
    activeTrainingJobs: [],
    addTrainingJob: (jobId) => set((state) => ({ activeTrainingJobs: [...state.activeTrainingJobs, jobId] })),
    removeTrainingJob: (jobId) => set((state) => ({ activeTrainingJobs: state.activeTrainingJobs.filter(id => id !== jobId) })),
    isSyncing: false,
    setSyncing: (status) => set({ isSyncing: status }),
    globalAlert: null,
    setGlobalAlert: (alert) => set({ globalAlert: alert }),
    validationTasks: [
        { id: 'VAL-772', model: 'OncoGene-v1.4', subject: 'SUBJ-AX-99', confidence: 0.62, status: 'Pending' },
        { id: 'VAL-773', model: 'RareConnect-v2.1', subject: 'SUBJ-BY-12', confidence: 0.88, status: 'Pending' }
    ],
    setValidationTasks: (tasks) => set({ validationTasks: tasks }),
    updateValidationTaskStatus: (id, status) => set((state) => ({
        validationTasks: state.validationTasks.map(t => t.id === id ? { ...t, status } : t)
    }))
}));
