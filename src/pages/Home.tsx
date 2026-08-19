import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { fetchCompanyDirectory, fetchPitches } from "@/lib/queries";
import { useSeo } from "@/lib/seo";
import { formatCount } from "@/lib/format";
import { MILESTONES } from "@/lib/types";
import { PitchRow } from "@/components/pitchme/PitchRow";
import { CompanyLogo } from "@/components/pitchme/CompanyLogo";
import { EmptyState, ErrorState, LoadingRows } from "@/components/pitchme/states";

export default function Home() {
  useSeo({
    title: "PitchMe: tell companies what to build next",
    description:
      "Pitch the feature a product is missing, gather public support, and we take the strongest ideas straight to the company. No account needed.",
    path: "/",
  });

  const top = useAsync(() => fetchPitches({ limit: 8, sort: "support" }), []);
  const fresh = useAsync(() => fetchPitches({ limit: 6, sort: "newest" }), []);
  const directory = useAsync(() => fetchCompanyDirectory(), []);

  const totalSupporters = (directory.data ?? []).reduce((sum, row) => sum + row.supporter_total, 0);
  const totalPitches = (directory.data ?? []).reduce((sum, row) => sum + row.pitch_count, 0);

  return (
    <>
      <section className="border-b border-border">
        <div className="shell grid gap-10 py-16 md:grid-cols-12 md:py-24">
          <div className="md:col-span-7">
            <p className="eyebrow rise">Public product feedback</p>
            <h1 className="display rise mt-4 text-4xl md:text-6xl" style={{ animationDelay: "40ms" }}>
              Tell companies what to build next.
            </h1>
            <p
              className="rise mt-5 max-w-xl text-base leading-relaxed text-muted-foreground"
              style={{ animationDelay: "90ms" }}
            >
              Describe the feature a product is missing. Other people add their support. When a
              pitch crosses a milestone, we send it to the company and publish whatever they say
              back, word for word.
            </p>
            <div className="rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: "140ms" }}>
              <Link
                to="/submit"
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground transition-all hover:brightness-105 active:scale-[0.99]"
              >
                Pitch a feature
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                to="/discover"
                className="inline-flex min-h-11 items-center rounded-md border border-border-strong px-5 text-sm font-medium transition-colors hover:bg-surface"
              >
                Browse pitches
              </Link>
            </div>
          </div>

          <aside className="rise md:col-span-5 md:pl-8" style={{ animationDelay: "180ms" }}>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-7">
              <div>
                <dt className="eyebrow">Pitches</dt>
                <dd className="numeric mt-1.5 text-3xl text-foreground">
                  {formatCount(totalPitches)}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Supporters</dt>
                <dd className="numeric mt-1.5 text-3xl text-foreground">
                  {formatCount(totalSupporters)}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Companies</dt>
                <dd className="numeric mt-1.5 text-3xl text-foreground">
                  {formatCount((directory.data ?? []).length)}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Milestones</dt>
                <dd className="numeric mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {MILESTONES.join(" / ")}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="shell py-14" aria-labelledby="most-supported">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="most-supported" className="text-sm font-semibold tracking-tight">
            Most supported
          </h2>
          <Link
            to="/discover"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            All pitches
          </Link>
        </div>

        <div className="mt-4 border-t border-border">
          {top.loading ? (
            <LoadingRows count={6} label="Loading pitches" />
          ) : top.error ? (
            <div className="pt-6">
              <ErrorState error={top.error} onRetry={top.reload} />
            </div>
          ) : (top.data ?? []).length === 0 ? (
            <EmptyState
              title="No pitches yet"
              hint="Be the first to describe a feature a product is missing."
            />
          ) : (
            <div className="divide-y divide-border">
              {(top.data ?? []).map((pitch, index) => (
                <PitchRow key={pitch.id} pitch={pitch} rank={index + 1} showBody />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="shell grid gap-12 border-t border-border py-14 md:grid-cols-12">
        <div className="md:col-span-7" aria-labelledby="recent">
          <h2 id="recent" className="text-sm font-semibold tracking-tight">
            Recently added
          </h2>
          <div className="mt-4 border-t border-border">
            {fresh.loading ? (
              <LoadingRows count={4} label="Loading recent pitches" />
            ) : fresh.error ? (
              <div className="pt-6">
                <ErrorState error={fresh.error} onRetry={fresh.reload} />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {(fresh.data ?? []).map((pitch) => (
                  <PitchRow key={pitch.id} pitch={pitch} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-5" aria-labelledby="active-companies">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="active-companies" className="text-sm font-semibold tracking-tight">
              Active companies
            </h2>
            <Link
              to="/companies"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Directory
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border border-t border-border">
            {(directory.data ?? []).slice(0, 8).map((row) => (
              <li key={row.company.id}>
                <Link
                  to={`/company/${row.company.slug}`}
                  className="flex items-center gap-3 py-3 transition-colors hover:bg-surface/60"
                >
                  <CompanyLogo company={row.company} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {row.company.name}
                  </span>
                  <span className="numeric text-xs text-subtle-foreground">
                    {formatCount(row.supporter_total)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
