export type PitchStatus = 'pending' | 'open' | 'contacted' | 'responded' | 'planned' | 'in_progress' | 'shipped' | 'declined';

export interface Company {
  id: string;
  name: string;
  slug: string;
  website?: string;
  logo_url?: string;
  description?: string;
}

export interface Product {
  id: string;
  company_id: string;
  name: string;
  slug: string;
}

export interface Pitch {
  id: string;
  company_id: string;
  product_id: string;
  title: string;
  slug: string;
  body: string;
  support_count: number;
  status: PitchStatus;
  email_milestones_sent: number[];
  created_at: string;
  company_response?: string;
  responded_at?: string;
  company_response_verified?: boolean;
}
