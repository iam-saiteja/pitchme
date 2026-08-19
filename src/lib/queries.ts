import { supabase } from "./supabase";
import { visitorId } from "./identity";
import type {
  Comment,
  Company,
  CompanyResponse,
  CompanyStats,
  Pitch,
  PitchWithContext,
  Product,
  ReactionKind,
} from "./types";

const PITCH_COLUMNS =
  "id,company_id,product_id,title,slug,body,suggested_slug,status,support_count,submitter_note,moderation_note,email_milestones_sent,last_email_milestone,contacted_at,responded_at,created_at,updated_at";

const COMPANY_EMBED =
  "company:companies(id,name,slug,website,logo_url,logo_source,logo_source_url)";
const PRODUCT_EMBED = "product:products(id,name,slug)";

function unwrap<T>(data: T | null, error: unknown): T {
  if (error) throw error;
  return (data ?? []) as T;
}

/* ---------------------------------------------------------------- companies */

export async function fetchCompanies(): Promise<Company[]> {
  const { data, error } = await supabase.from("companies").select("*").order("name");
  return unwrap<Company[]>(data as Company[] | null, error);
}

export async function fetchCompanyBySlug(slug: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as Company | null) ?? null;
}

export async function fetchProducts(companyId?: string): Promise<Product[]> {
  let query = supabase.from("products").select("*").order("name");
  if (companyId) query = query.eq("company_id", companyId);
  const { data, error } = await query;
  return unwrap<Product[]>(data as Product[] | null, error);
}

/**
 * Directory totals. Public pitch rows are already filtered by row level
 * security (pending pitches are invisible), so counts are honest by
 * construction. The dataset is small enough to aggregate in the browser.
 */
export async function fetchCompanyDirectory(): Promise<CompanyStats[]> {
  const [companies, products, pitches] = await Promise.all([
    fetchCompanies(),
    fetchProducts(),
    supabase
      .from("pitches")
      .select("id,company_id,product_id,support_count")
      .then(({ data, error }) =>
        unwrap<{ id: string; company_id: string; product_id: string; support_count: number }[]>(
          data as never,
          error,
        ),
      ),
  ]);

  return companies
    .map((company) => {
      const companyPitches = pitches.filter((p) => p.company_id === company.id);
      return {
        company,
        product_count: products.filter((p) => p.company_id === company.id).length,
        pitch_count: companyPitches.length,
        supporter_total: companyPitches.reduce((sum, p) => sum + (p.support_count ?? 0), 0),
      };
    })
    .sort(
      (a, b) =>
        b.supporter_total - a.supporter_total ||
        b.pitch_count - a.pitch_count ||
        a.company.name.localeCompare(b.company.name),
    );
}

/* ------------------------------------------------------------------ pitches */

export async function fetchPitches(options?: {
  companyId?: string;
  productId?: string;
  limit?: number;
  sort?: "support" | "newest";
}): Promise<PitchWithContext[]> {
  let query = supabase.from("pitches").select(`${PITCH_COLUMNS},${COMPANY_EMBED},${PRODUCT_EMBED}`);

  if (options?.companyId) query = query.eq("company_id", options.companyId);
  if (options?.productId) query = query.eq("product_id", options.productId);

  query =
    options?.sort === "newest"
      ? query.order("created_at", { ascending: false })
      : query.order("support_count", { ascending: false }).order("created_at", {
          ascending: false,
        });

  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  return unwrap<PitchWithContext[]>(data as never, error);
}

export async function fetchPitch(
  companySlug: string,
  productSlug: string,
  pitchSlug: string,
): Promise<PitchWithContext | null> {
  const { data, error } = await supabase
    .from("pitches")
    .select(
      `${PITCH_COLUMNS},company:companies!inner(id,name,slug,website,logo_url,logo_source,logo_source_url),product:products!inner(id,name,slug)`,
    )
    .eq("slug", pitchSlug)
    .eq("companies.slug", companySlug)
    .eq("products.slug", productSlug)
    .maybeSingle();

  if (error) throw error;
  return (data as PitchWithContext | null) ?? null;
}

/* ------------------------------------------------- discussion and responses */

export async function fetchApprovedComments(pitchId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("id,pitch_id,body,display_name,approved,created_at")
    .eq("pitch_id", pitchId)
    .eq("approved", true)
    .order("created_at", { ascending: false });
  return unwrap<Comment[]>(data as never, error);
}

export async function fetchPublishedResponse(pitchId: string): Promise<CompanyResponse | null> {
  const { data, error } = await supabase
    .from("company_responses")
    .select("*")
    .eq("pitch_id", pitchId)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as CompanyResponse | null) ?? null;
}

/* ------------------------------------------------- anonymous participation */

export interface VisitorPitchState {
  supported: boolean;
  reaction: ReactionKind | null;
  reaction_counts: Partial<Record<ReactionKind, number>>;
}

/** The database, not the browser, is the source of truth for this. */
export async function fetchVisitorState(pitchId: string): Promise<VisitorPitchState> {
  const { data, error } = await supabase.rpc("visitor_pitch_state", {
    p_pitch_id: pitchId,
    p_fingerprint: visitorId(),
  });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as VisitorPitchState | null;
  return {
    supported: Boolean(row?.supported),
    reaction: row?.reaction ?? null,
    reaction_counts: row?.reaction_counts ?? {},
  };
}

export async function supportPitch(pitchId: string): Promise<number> {
  const { data, error } = await supabase.rpc("increment_support", {
    p_pitch_id: pitchId,
    p_fingerprint: visitorId(),
  });
  if (error) throw error;
  return Number(data ?? 0);
}

export async function reactToPitch(pitchId: string, reaction: ReactionKind): Promise<void> {
  const { error } = await supabase.rpc("add_pitch_reaction", {
    p_pitch_id: pitchId,
    p_fingerprint: visitorId(),
    p_reaction: reaction,
  });
  if (error) throw error;
}

export async function submitComment(pitchId: string, body: string): Promise<void> {
  const { data, error } = await supabase.rpc("add_pitch_comment", {
    p_pitch_id: pitchId,
    p_fingerprint: visitorId(),
    p_body: body,
  });
  if (error) throw error;
  if (!data) throw new Error("Your comment could not be saved. Please check the text and retry.");
}

export interface PitchDraft {
  company_id?: string | null;
  new_company_name?: string | null;
  product_id?: string | null;
  new_product_name?: string | null;
  title: string;
  body: string;
  suggested_slug?: string | null;
}

/**
 * Anonymous submission. The row is created as `pending`, so it is invisible to
 * the public until an administrator publishes it. A company the visitor typed
 * in is created as an unverified draft for an administrator to complete.
 */
export async function submitPitch(draft: PitchDraft): Promise<{ id: string }> {
  const { data, error } = await supabase.rpc("submit_pitch", {
    p_company_id: draft.company_id ?? null,
    p_new_company_name: draft.new_company_name ?? null,
    p_product_id: draft.product_id ?? null,
    p_new_product_name: draft.new_product_name ?? null,
    p_title: draft.title,
    p_body: draft.body,
    p_suggested_slug: draft.suggested_slug ?? null,
    p_fingerprint: visitorId(),
  });
  if (error) throw error;
  if (!data) throw new Error("Your pitch could not be submitted. Please review the fields.");
  return { id: String(data) };
}


export function pitchPath(pitch: {
  company: { slug: string };
  product: { slug: string };
  slug: string;
}): string {
  return `/pitch/${pitch.company.slug}/${pitch.product.slug}/${pitch.slug}`;
}

export type { Pitch };
