import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAsync } from "@/hooks/useAsync";
import {
  fetchApprovedComments,
  fetchPitch,
  fetchPublishedResponse,
  fetchVisitorState,
} from "@/lib/queries";
import { truncateForMeta, useSeo } from "@/lib/seo";
import { formatCount, formatDate, relativeDate } from "@/lib/format";
import { MILESTONES, type Comment, type ReactionKind } from "@/lib/types";
import { CompanyLogo } from "@/components/pitchme/CompanyLogo";
import { StatusBadge } from "@/components/pitchme/StatusBadge";
import { SupportButton } from "@/components/pitchme/SupportButton";
import { Reactions } from "@/components/pitchme/Reactions";
import { Comments } from "@/components/pitchme/Comments";
import { ErrorState, LoadingRows } from "@/components/pitchme/states";
import NotFound from "./NotFound";

function MilestoneTrack({ count }: { count: number }) {
  const next: number = MILESTONES.find((m) => count < m) ?? MILESTONES[MILESTONES.length - 1] ?? 1;
  const previous = [...MILESTONES].reverse().find((m) => count >= m) ?? 0;
  const span = Math.max(next - previous, 1);
  const progress = Math.min(Math.max((count - previous) / span, 0), 1);

  return (
    <section aria-labelledby="milestone" className="rounded-lg border border-border bg-surface p-5">
      <h2 id="milestone" className="eyebrow">
        Milestone progress
      </h2>
      <p className="mt-2 text-sm text-foreground">
        <span className="numeric">{formatCount(count)}</span> of{" "}
        <span className="numeric">{formatCount(next)}</span> supporters needed before the next
        outreach.
      </p>
      <div
        className="mt-4 h-1 w-full overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={count}
        aria-valuemin={previous}
        aria-valuemax={next}
        aria-label="Supporters toward the next milestone"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
          style={{ width: `${Math.max(progress * 100, 2)}%` }}
        />
      </div>
      <ol className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {MILESTONES.map((milestone) => (
          <li
            key={milestone}
            className={
              count >= milestone
                ? "numeric text-xs text-accent"
                : "numeric text-xs text-subtle-foreground"
            }
          >
            {count >= milestone ? "reached " : ""}
            {formatCount(milestone)}
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs leading-relaxed text-subtle-foreground">
        At each milestone a person, not a bot, contacts the company and publishes any reply here.
      </p>
    </section>
  );
}

export default function PitchDetail() {
  const { companySlug = "", productSlug = "", pitchSlug = "" } = useParams();
  const pitchState = useAsync(
    () => fetchPitch(companySlug, productSlug, pitchSlug),
    [companySlug, productSlug, pitchSlug],
  );
  const pitch = pitchState.data;

  const [supportCount, setSupportCount] = useState(0);
  const [supported, setSupported] = useState(false);
  const [reaction, setReaction] = useState<ReactionKind | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Partial<Record<ReactionKind, number>>>({});
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (!pitch) return;
    setSupportCount(pitch.support_count ?? 0);

    let alive = true;
    void fetchVisitorState(pitch.id)
      .then((state) => {
        if (!alive) return;
        setSupported(state.supported);
        setReaction(state.reaction);
        setReactionCounts(state.reaction_counts);
      })
      .catch(() => {
        // Participation state is a nicety: the page stays usable without it.
      });
    void fetchApprovedComments(pitch.id)
      .then((rows) => alive && setComments(rows))
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, [pitch]);

  const response = useAsync(
    async () => (pitch ? fetchPublishedResponse(pitch.id) : null),
    [pitch?.id],
  );

  useSeo({
    title: pitch
      ? `${pitch.title} | ${pitch.company.name} ${pitch.product.name} | PitchMe`
      : "Pitch | PitchMe",
    description: pitch
      ? truncateForMeta(pitch.body)
      : "A community feature pitch on PitchMe.",
    path: `/pitch/${companySlug}/${productSlug}/${pitchSlug}`,
    type: "article",
  });

  if (!pitchState.loading && !pitchState.error && !pitch) return <NotFound />;

  return (
    <div className="shell py-12">
      {pitchState.error ? (
        <ErrorState error={pitchState.error} onRetry={pitchState.reload} />
      ) : !pitch ? (
        <LoadingRows count={3} label="Loading pitch" />
      ) : (
        <div className="grid gap-12 lg:grid-cols-12">
          <article className="lg:col-span-8">
            <nav aria-label="Breadcrumb" className="text-xs text-subtle-foreground">
              <Link to="/discover" className="transition-colors hover:text-foreground">
                Discover
              </Link>
              <span aria-hidden="true" className="px-2">
                /
              </span>
              <Link
                to={`/company/${pitch.company.slug}`}
                className="transition-colors hover:text-foreground"
              >
                {pitch.company.name}
              </Link>
              <span aria-hidden="true" className="px-2">
                /
              </span>
              <span className="text-muted-foreground">{pitch.product.name}</span>
            </nav>

            <header className="mt-5">
              <div className="flex items-center gap-3">
                <CompanyLogo company={pitch.company} size="md" />
                <p className="text-sm text-muted-foreground">
                  <Link
                    to={`/company/${pitch.company.slug}`}
                    className="font-medium text-foreground/90 hover:underline"
                  >
                    {pitch.company.name}
                  </Link>
                  <span aria-hidden="true" className="px-2 text-subtle-foreground">
                    /
                  </span>
                  {pitch.product.name}
                </p>
              </div>

              <h1 className="display mt-4 text-3xl md:text-4xl">{pitch.title}</h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-subtle-foreground">
                <StatusBadge status={pitch.status} />
                <time dateTime={pitch.created_at}>Posted {relativeDate(pitch.created_at)}</time>
                {pitch.contacted_at ? (
                  <span>Company contacted {formatDate(pitch.contacted_at)}</span>
                ) : null}
              </div>
            </header>

            <div className="reading mt-8 text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90">
              {pitch.body}
            </div>

            <div className="mt-8 border-y border-border py-6">
              <SupportButton
                pitchId={pitch.id}
                count={supportCount}
                supported={supported}
                onChange={({ count, supported: next }) => {
                  setSupportCount(count);
                  setSupported(next);
                }}
              />
              <div className="mt-5">
                <Reactions
                  pitchId={pitch.id}
                  current={reaction}
                  counts={reactionCounts}
                  onChange={(next) => {
                    setReactionCounts((counts) => {
                      const updated = { ...counts };
                      if (reaction) updated[reaction] = Math.max((updated[reaction] ?? 1) - 1, 0);
                      updated[next] = (updated[next] ?? 0) + 1;
                      return updated;
                    });
                    setReaction(next);
                  }}
                />
              </div>
            </div>

            {response.data ? (
              <section
                aria-labelledby="company-response"
                className="mt-10 rounded-lg border border-accent/30 bg-accent-soft p-6"
              >
                <h2 id="company-response" className="eyebrow text-accent">
                  Verified company response
                </h2>
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {response.data.body}
                </p>
                <p className="mt-4 text-xs text-subtle-foreground">
                  Published {formatDate(response.data.published_at)} and reproduced as received.
                </p>
              </section>
            ) : null}

            <Comments pitchId={pitch.id} comments={comments} onRefresh={setComments} />
          </article>

          <aside className="space-y-6 lg:col-span-4">
            <MilestoneTrack count={supportCount} />

            <section className="rounded-lg border border-border p-5">
              <h2 className="eyebrow">How this works</h2>
              <ol className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <li>1. Someone describes a missing feature.</li>
                <li>2. Anyone can add support without an account.</li>
                <li>3. At 1, 25, 50, 100, 500 and 1000 supporters we contact the company.</li>
                <li>4. Verified replies are published on this page.</li>
              </ol>
              <Link
                to="/submit"
                className="mt-5 inline-flex min-h-10 items-center rounded-md border border-border-strong px-4 text-sm font-medium transition-colors hover:bg-surface"
              >
                Pitch something else
              </Link>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
