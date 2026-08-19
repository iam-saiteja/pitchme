import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase, readableError } from "@/lib/supabase";
import { useSeo } from "@/lib/seo";
import { formatCount, formatDate, relativeDate, slugify } from "@/lib/format";
import {
  MILESTONES,
  STATUS_LABEL,
  type Comment,
  type Company,
  type Pitch,
  type PitchStatus,
} from "@/lib/types";
import { ErrorState, LoadingRows } from "@/components/pitchme/states";
import { cn } from "@/lib/utils";

type Tab = "queue" | "companies" | "comments" | "milestones" | "responses";

const TABS: { id: Tab; label: string }[] = [
  { id: "queue", label: "Pitch queue" },
  { id: "companies", label: "Companies" },
  { id: "comments", label: "Comments" },
  { id: "milestones", label: "Milestones" },
  { id: "responses", label: "Responses" },
];


function reachedMilestone(count: number): number | null {
  const reached = [...MILESTONES].reverse().find((m) => count >= m);
  return reached ?? null;
}

/* --------------------------------------------------------------- sign in */

function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onSignedIn();
    } catch (error) {
      toast.error(readableError(error, "Those credentials were not accepted."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell flex min-h-[70vh] max-w-sm flex-col justify-center py-16">
      <p className="eyebrow">Restricted</p>
      <h1 className="display mt-3 text-2xl">Admin sign in</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm text-muted-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1.5 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm focus:border-border-strong focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm text-muted-foreground">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm focus:border-border-strong focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 w-full rounded-md bg-accent text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {busy ? "Signing in" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------ dashboard */

interface AdminPitch extends Pitch {
  company: { id: string; name: string; slug: string } | null;
  product: { id: string; name: string; slug: string } | null;
}

export default function Admin() {
  useSeo({
    title: "Admin | PitchMe",
    description: "Internal moderation console for PitchMe.",
    path: "/admin",
  });

  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<Tab>("queue");

  const [pitches, setPitches] = useState<AdminPitch[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pitchRes, commentRes, companyRes] = await Promise.all([
        supabase
          .from("pitches")
          .select("*,company:companies(id,name,slug),product:products(id,name,slug)")
          .order("created_at", { ascending: false }),
        supabase.from("comments").select("*").order("created_at", { ascending: false }),
        supabase.from("companies").select("*").order("name"),
      ]);
      if (pitchRes.error) throw pitchRes.error;
      if (commentRes.error) throw commentRes.error;
      if (companyRes.error) throw companyRes.error;
      setPitches((pitchRes.data ?? []) as AdminPitch[]);
      setComments((commentRes.data ?? []) as Comment[]);
      setCompanies((companyRes.data ?? []) as Company[]);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) void load();
  }, [session, load]);

  const pending = useMemo(() => pitches.filter((p) => p.status === "pending"), [pitches]);
  const unverified = useMemo(() => companies.filter((c) => c.verified === false), [companies]);
  const unapproved = useMemo(() => comments.filter((c) => !c.approved), [comments]);

  const milestoneWork = useMemo(
    () =>
      pitches
        .filter((p) => p.status !== "pending")
        .map((p) => ({ pitch: p, milestone: reachedMilestone(p.support_count) }))
        .filter(
          (row) =>
            row.milestone !== null &&
            !(row.pitch.email_milestones_sent ?? []).includes(row.milestone),
        )
        .sort((a, b) => (b.milestone ?? 0) - (a.milestone ?? 0)),
    [pitches],
  );

  async function patchPitch(id: string, patch: Record<string, unknown>, message: string) {
    const { error: err } = await supabase.from("pitches").update(patch).eq("id", id);
    if (err) {
      toast.error(readableError(err, "That change could not be saved."));
      return;
    }
    toast.success(message);
    void load();
  }

  async function patchComment(id: string, patch: Record<string, unknown>, message: string) {
    const { error: err } = await supabase.from("comments").update(patch).eq("id", id);
    if (err) {
      toast.error(readableError(err, "That change could not be saved."));
      return;
    }
    toast.success(message);
    void load();
  }

  async function removeComment(id: string) {
    const { error: err } = await supabase.from("comments").delete().eq("id", id);
    if (err) {
      toast.error(readableError(err, "That comment could not be deleted."));
      return;
    }
    toast.success("Comment deleted.");
    void load();
  }

  if (checking) {
    return (
      <div className="shell py-16">
        <LoadingRows count={3} label="Checking access" />
      </div>
    );
  }

  if (!session) return <SignIn onSignedIn={() => void load()} />;

  return (
    <div className="shell py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Moderation console</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-subtle-foreground">{session.user.email}</span>
          <button
            type="button"
            onClick={() => void supabase.auth.signOut()}
            className="min-h-9 rounded-md border border-border px-3 text-xs transition-colors hover:bg-surface"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mt-6 flex flex-wrap gap-1 border-b border-border" role="tablist">
        {TABS.map((item) => {
          const badge =
            item.id === "queue"
              ? pending.length
              : item.id === "companies"
                ? unverified.length
                : item.id === "comments"
                  ? unapproved.length
                  : item.id === "milestones"
                    ? milestoneWork.length
                    : 0;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "-mb-px border-b-2 px-3 py-2.5 text-sm transition-colors",
                tab === item.id
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
              {badge > 0 ? (
                <span className="numeric ml-2 rounded-full bg-surface-raised px-1.5 py-0.5 text-[11px] text-foreground">
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        {error ? (
          <ErrorState error={error} onRetry={load} />
        ) : loading ? (
          <LoadingRows count={5} label="Loading console" />
        ) : tab === "queue" ? (
          <PitchQueue pitches={pending} onPatch={patchPitch} />
        ) : tab === "companies" ? (
          <CompanyDesk companies={companies} onDone={load} />
        ) : tab === "comments" ? (
          <CommentQueue
            comments={comments}
            unapproved={unapproved}
            onPatch={patchComment}
            onDelete={removeComment}
          />
        ) : tab === "milestones" ? (
          <Milestones rows={milestoneWork} onPatch={patchPitch} />
        ) : (
          <Responses pitches={pitches} onDone={load} />
        )}

      </div>
    </div>
  );
}

/* --------------------------------------------------------------- panels */

function PitchQueue({
  pitches,
  onPatch,
}: {
  pitches: AdminPitch[];
  onPatch: (id: string, patch: Record<string, unknown>, message: string) => Promise<void>;
}) {
  if (pitches.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing waiting for review.</p>;
  }

  return (
    <ul className="divide-y divide-border border-t border-border">
      {pitches.map((pitch) => (
        <li key={pitch.id} className="py-6">
          <p className="text-xs text-subtle-foreground">
            {pitch.company?.name ?? "Unknown company"} / {pitch.product?.name ?? "Unknown product"}
            <span className="px-2">|</span>
            {relativeDate(pitch.created_at)}
          </p>
          <h2 className="mt-1.5 text-[15px] font-medium text-foreground">{pitch.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {pitch.body}
          </p>
          {pitch.submitter_note ? (
            <p className="mt-2 text-xs text-subtle-foreground">Note: {pitch.submitter_note}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                onPatch(
                  pitch.id,
                  { status: "open", slug: pitch.slug || slugify(pitch.title) },
                  "Pitch published.",
                )
              }
              className="min-h-9 rounded-md bg-accent px-4 text-xs font-medium text-accent-foreground"
            >
              Publish
            </button>
            <button
              type="button"
              onClick={() => {
                const note = window.prompt("Reason for declining (optional)") ?? "";
                void onPatch(
                  pitch.id,
                  { status: "declined", moderation_note: note },
                  "Pitch declined.",
                );
              }}
              className="min-h-9 rounded-md border border-border px-4 text-xs transition-colors hover:bg-surface"
            >
              Decline
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CommentQueue({
  comments,
  unapproved,
  onPatch,
  onDelete,
}: {
  comments: Comment[];
  unapproved: Comment[];
  onPatch: (id: string, patch: Record<string, unknown>, message: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? comments : unapproved;

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="min-h-9 rounded-md border border-border px-3 text-xs transition-colors hover:bg-surface"
        >
          {showAll ? "Show pending only" : "Show all comments"}
        </button>
        <span className="numeric text-xs text-subtle-foreground">{rows.length} shown</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments waiting for review.</p>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {rows.map((comment) => (
            <li key={comment.id} className="py-5">
              <p className="text-xs text-subtle-foreground">
                {comment.display_name?.trim() || "Anonymous"}
                <span className="px-2">|</span>
                {relativeDate(comment.created_at)}
                <span className="px-2">|</span>
                {comment.approved ? "approved" : "pending"}
              </p>
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                {comment.body}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {comment.approved ? (
                  <button
                    type="button"
                    onClick={() => void onPatch(comment.id, { approved: false }, "Comment hidden.")}
                    className="min-h-9 rounded-md border border-border px-4 text-xs transition-colors hover:bg-surface"
                  >
                    Hide
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void onPatch(comment.id, { approved: true }, "Comment approved.")}
                    className="min-h-9 rounded-md bg-accent px-4 text-xs font-medium text-accent-foreground"
                  >
                    Approve
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Delete this comment permanently?")) {
                      void onDelete(comment.id);
                    }
                  }}
                  className="min-h-9 rounded-md border border-border px-4 text-xs text-[color:var(--color-destructive)] transition-colors hover:bg-surface"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Milestones({
  rows,
  onPatch,
}: {
  rows: { pitch: AdminPitch; milestone: number | null }[];
  onPatch: (id: string, patch: Record<string, unknown>, message: string) => Promise<void>;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Every reached milestone has been contacted. Nothing to send.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border border-t border-border">
      {rows.map(({ pitch, milestone }) => (
        <li key={pitch.id} className="flex flex-wrap items-start justify-between gap-4 py-5">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-subtle-foreground">
              {pitch.company?.name} / {pitch.product?.name}
              <span className="px-2">|</span>
              {STATUS_LABEL[pitch.status as PitchStatus]}
            </p>
            <h2 className="mt-1 text-[15px] font-medium text-foreground">{pitch.title}</h2>
            <p className="numeric mt-1.5 text-xs text-accent">
              {formatCount(pitch.support_count)} supporters, milestone{" "}
              {formatCount(milestone ?? 0)} reached
            </p>
            {pitch.contacted_at ? (
              <p className="mt-1 text-xs text-subtle-foreground">
                Last contact {formatDate(pitch.contacted_at)}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() =>
              onPatch(
                pitch.id,
                {
                  status: "contacted",
                  contacted_at: new Date().toISOString(),
                  last_email_milestone: milestone,
                  email_milestones_sent: [
                    ...(pitch.email_milestones_sent ?? []),
                    milestone as number,
                  ],
                },
                "Marked as contacted.",
              )
            }
            className="min-h-9 shrink-0 rounded-md border border-border-strong px-4 text-xs font-medium transition-colors hover:bg-surface"
          >
            Mark contacted
          </button>
        </li>
      ))}
    </ul>
  );
}

function Responses({ pitches, onDone }: { pitches: AdminPitch[]; onDone: () => void }) {
  const [pitchId, setPitchId] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const eligible = pitches.filter((p) => p.status !== "pending");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!pitchId || body.trim().length < 10) {
      toast.error("Pick a pitch and paste the reply you received.");
      return;
    }
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from("company_responses").insert({
        pitch_id: pitchId,
        body: body.trim(),
        verified: true,
        received_at: now,
        published_at: now,
      });
      if (error) throw error;
      await supabase
        .from("pitches")
        .update({ status: "responded", responded_at: now })
        .eq("id", pitchId);
      setBody("");
      setPitchId("");
      toast.success("Response published.");
      onDone();
    } catch (error) {
      toast.error(readableError(error, "That response could not be published."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div>
        <label htmlFor="pitch" className="block text-sm text-muted-foreground">
          Pitch
        </label>
        <select
          id="pitch"
          value={pitchId}
          onChange={(event) => setPitchId(event.target.value)}
          className="mt-1.5 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm focus:border-border-strong focus:outline-none"
        >
          <option value="">Select a pitch</option>
          {eligible.map((pitch) => (
            <option key={pitch.id} value={pitch.id}>
              {pitch.company?.name}: {pitch.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="response" className="block text-sm text-muted-foreground">
          Verified reply, reproduced exactly as received
        </label>
        <textarea
          id="response"
          rows={7}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="mt-1.5 w-full resize-y rounded-md border border-border bg-surface px-3 py-2.5 text-sm leading-relaxed focus:border-border-strong focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="min-h-11 rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground disabled:opacity-60"
      >
        {busy ? "Publishing" : "Publish response"}
      </button>
    </form>
  );
}

/* ------------------------------------------------------- company review */

const EMPTY_DRAFT = {
  name: "",
  slug: "",
  website: "",
  logo_url: "",
  logo_source: "",
  logo_source_url: "",
  description: "",
  review_note: "",
};

type CompanyDraft = typeof EMPTY_DRAFT;

function toDraft(company: Company): CompanyDraft {
  return {
    name: company.name ?? "",
    slug: company.slug ?? "",
    website: company.website ?? "",
    logo_url: company.logo_url ?? "",
    logo_source: company.logo_source ?? "",
    logo_source_url: company.logo_source_url ?? "",
    description: company.description ?? "",
    review_note: company.review_note ?? "",
  };
}

function CompanyDesk({ companies, onDone }: { companies: Company[]; onDone: () => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CompanyDraft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const pendingCompanies = companies.filter((c) => c.verified === false);
  const rows = showAll ? companies : pendingCompanies;

  function open(company: Company) {
    setOpenId(company.id);
    setDraft(toDraft(company));
  }

  async function save(company: Company, verify: boolean) {
    if (draft.name.trim().length < 2 || draft.slug.trim().length < 2) {
      toast.error("A company needs a name and a URL slug.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          name: draft.name.trim(),
          slug: slugify(draft.slug),
          website: draft.website.trim() || null,
          logo_url: draft.logo_url.trim() || null,
          logo_source: draft.logo_source.trim() || null,
          logo_source_url: draft.logo_source_url.trim() || null,
          description: draft.description.trim() || null,
          review_note: draft.review_note.trim() || null,
          ...(verify ? { verified: true } : {}),
        })
        .eq("id", company.id);
      if (error) throw error;
      toast.success(verify ? "Company verified and published." : "Company details saved.");
      setOpenId(null);
      onDone();
    } catch (error) {
      toast.error(readableError(error, "Those details could not be saved."));
    } finally {
      setBusy(false);
    }
  }

  async function remove(company: Company) {
    if (!window.confirm(`Delete ${company.name}? Pitches attached to it are removed too.`)) return;
    const { error } = await supabase.from("companies").delete().eq("id", company.id);
    if (error) {
      toast.error(readableError(error, "That company could not be deleted."));
      return;
    }
    toast.success("Company deleted.");
    onDone();
  }

  function field(key: keyof CompanyDraft, label: string, hint?: string, textarea = false) {
    const id = `company-${key}`;
    return (
      <div>
        <label htmlFor={id} className="block text-xs text-subtle-foreground">
          {label}
        </label>
        {textarea ? (
          <textarea
            id={id}
            rows={4}
            value={draft[key]}
            onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
            className="mt-1.5 w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm leading-relaxed focus:border-border-strong focus:outline-none"
          />
        ) : (
          <input
            id={id}
            value={draft[key]}
            placeholder={hint}
            onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
            className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm placeholder:text-subtle-foreground focus:border-border-strong focus:outline-none"
          />
        )}
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="min-h-9 rounded-md border border-border px-3 text-xs transition-colors hover:bg-surface"
        >
          {showAll ? "Show awaiting review only" : "Show all companies"}
        </button>
        <span className="numeric text-xs text-subtle-foreground">{rows.length} shown</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No visitor submitted companies are waiting for details.
        </p>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {rows.map((company) => (
            <li key={company.id} className="py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-subtle-foreground">
                    /{company.slug}
                    <span className="px-2">|</span>
                    {company.verified === false ? "Awaiting details" : "Published"}
                    <span className="px-2">|</span>
                    added {relativeDate(company.created_at)}
                  </p>
                  <h2 className="mt-1 text-[15px] font-medium text-foreground">{company.name}</h2>
                  {company.description ? (
                    <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
                      {company.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => (openId === company.id ? setOpenId(null) : open(company))}
                    className="min-h-9 rounded-md border border-border-strong px-4 text-xs font-medium transition-colors hover:bg-surface"
                  >
                    {openId === company.id ? "Close" : "Edit details"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(company)}
                    className="min-h-9 rounded-md border border-border px-4 text-xs text-[color:var(--color-destructive)] transition-colors hover:bg-surface"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {openId === company.id ? (
                <div className="mt-5 grid max-w-3xl gap-4 rounded-md border border-border bg-surface p-4 md:grid-cols-2">
                  {field("name", "Name")}
                  {field("slug", "URL slug", "linear")}
                  {field("website", "Website", "https://linear.app")}
                  {field("logo_url", "Logo image URL", "https://...svg")}
                  {field("logo_source", "Logo source", "Simple Icons")}
                  {field("logo_source_url", "Logo source URL", "https://simpleicons.org")}
                  <div className="md:col-span-2">{field("description", "About", "", true)}</div>
                  <div className="md:col-span-2">
                    {field("review_note", "Internal note", "Optional, admin only")}
                  </div>
                  <div className="flex flex-wrap gap-2 md:col-span-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void save(company, true)}
                      className="min-h-9 rounded-md bg-accent px-4 text-xs font-medium text-accent-foreground disabled:opacity-60"
                    >
                      {company.verified === false ? "Verify and publish" : "Save and keep public"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void save(company, false)}
                      className="min-h-9 rounded-md border border-border px-4 text-xs transition-colors hover:bg-surface-raised disabled:opacity-60"
                    >
                      Save draft
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
