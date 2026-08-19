export type PitchStatus =
  | "pending"
  | "open"
  | "contacted"
  | "responded"
  | "planned"
  | "in_progress"
  | "shipped"
  | "declined";

export type ReactionKind = "supportive" | "love" | "fire" | "helpful" | "agree" | "not_enough";

export const MILESTONES = [1, 25, 50, 100, 500, 1000] as const;
export type Milestone = (typeof MILESTONES)[number];

export interface Company {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  logo_url: string | null;
  logo_source: string | null;
  logo_source_url: string | null;
  description: string | null;
  contact_email?: string | null;
  /** False while an administrator still has to fill in the company details. */
  verified?: boolean;
  review_note?: string | null;
  created_at: string;
}


export interface Product {
  id: string;
  company_id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Pitch {
  id: string;
  company_id: string;
  product_id: string;
  title: string;
  slug: string;
  body: string;
  suggested_slug: string | null;
  status: PitchStatus;
  support_count: number;
  submitter_note: string | null;
  moderation_note: string | null;
  email_milestones_sent: number[];
  last_email_milestone: number | null;
  contacted_at: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PitchWithContext extends Pitch {
  company: Pick<
    Company,
    "id" | "name" | "slug" | "website" | "logo_url" | "logo_source" | "logo_source_url"
  >;
  product: Pick<Product, "id" | "name" | "slug">;
}

export interface Comment {
  id: string;
  pitch_id: string;
  body: string;
  display_name: string | null;
  approved: boolean;
  created_at: string;
}

export interface CompanyResponse {
  id: string;
  pitch_id: string;
  body: string;
  verified: boolean;
  received_at: string | null;
  published_at: string | null;
  created_at: string;
}

export interface CompanyStats {
  company: Company;
  product_count: number;
  pitch_count: number;
  supporter_total: number;
}

export const STATUS_LABEL: Record<PitchStatus, string> = {
  pending: "Awaiting review",
  open: "Open",
  contacted: "Company contacted",
  responded: "Company responded",
  planned: "Planned by company",
  in_progress: "In development",
  shipped: "Shipped",
  declined: "Declined by company",
};

/** Statuses a visitor may see in public listings. */
export const PUBLIC_STATUSES: PitchStatus[] = [
  "open",
  "contacted",
  "responded",
  "planned",
  "in_progress",
  "shipped",
  "declined",
];

export const REACTION_LABEL: Record<"helpful" | "agree" | "not_enough", string> = {
  helpful: "Helpful",
  agree: "I agree",
  not_enough: "Not enough",
};

export interface ReactionOption {
  kind: ReactionKind;
  label: string;
  emoji: string;
}

export const REACTIONS: ReactionOption[] = [
  { kind: "helpful", label: "Helpful", emoji: "\u{1F4A1}" },
  { kind: "agree", label: "I agree", emoji: "\u{1F44D}" },
  { kind: "not_enough", label: "Not enough", emoji: "\u{1F914}" },
];
