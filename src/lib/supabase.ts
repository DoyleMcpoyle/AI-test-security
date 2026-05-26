import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'internal_investigator' | 'internal_case_manager' | 'external_case_manager' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  organization: string | null;
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: string;
  name: string;
  description: string | null;
  client_organization: string;
  created_at: string;
}

export interface TestingCenter {
  id: string;
  name: string;
  location: string;
  country: string;
  address: string | null;
  timezone: string;
  created_at: string;
}

export interface Video {
  id: string;
  program_id: string;
  testing_center_id: string;
  test_date: string;
  session_id: string;
  video_url: string;
  duration_seconds: number;
  status: 'processing' | 'ready' | 'flagged' | 'reviewed';
  total_violations: number;
  reviewed_violations: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  program?: Program;
  testing_center?: TestingCenter;
}

export interface ViolationType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  color: string;
  created_at: string;
}

export interface Violation {
  id: string;
  video_id: string;
  violation_type_id: string;
  timestamp_seconds: number;
  confidence_score: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'needs_review';
  ai_metadata: Record<string, unknown>;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  violation_type?: ViolationType;
}

export interface Adjudication {
  id: string;
  violation_id: string;
  reviewer_id: string;
  decision: 'confirmed' | 'rejected' | 'escalated';
  notes: string | null;
  reviewed_at: string;
}
