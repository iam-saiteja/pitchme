export type PitchStatus =
  | 'pending'
  | 'open'
  | 'contacted'
  | 'responded'
  | 'planned'
  | 'in_progress'
  | 'shipped'
  | 'declined';

export interface Company {
  id: string;
  name: string;
  slug: string;
  website?: string | null;
  logo_url?: string | null;
  description?: string | null;
  contact_email?: string | null;
}

export interface Product {
  id: string;
  company_id: string;
  name: string;
  slug: string;
}

export interface CompanyResponse {
  id: string;
  pitch_id: string;
  body: string;
  verified: boolean;
  received_at?: string | null;
  published_at?: string | null;
}

export interface Pitch {
  id: string;
  company_id: string;
  product_id: string;
  title: string;
  slug: string;
  body: string;
  suggested_slug?: string | null;
  support_count: number;
  status: PitchStatus;
  email_milestones_sent: number[];
  contacted_at?: string | null;
  company_response?: string | null;
  company_response_verified?: boolean;
  responded_at?: string | null;
  created_at: string;
  company?: Company;
  product?: Product;
}

export interface Comment {
  id: string;
  pitch_id: string;
  body: string;
  display_name?: string | null;
  created_at: string;
}
