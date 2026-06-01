export interface User {
  id: string;
  name: string;
  email: string;
  role: 'researcher' | 'clinician' | 'admin' | 'platform_admin' | 'hospital_admin' | 'data_custodian' | 'auditor';
  isAuthenticated?: boolean;
  avatar_url?: string;
  fedcoin_balance?: number;
  username?: string;
  organization?: Organization;
}

export interface Organization {
  id: string;
  name: string;
  subscription_tier: 'free' | 'pro' | 'institutional';
}

export interface GenomicDataset {
  id: string;
  name: string;
  sizeMB: number;
  patients: number;
  status: 'active' | 'processing' | 'archived';
}

export interface TrainingJob {
  id: string;
  model: string;
  status: 'initializing' | 'training' | 'completed' | 'failed';
  progress: number;
}
