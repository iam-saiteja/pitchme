import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAsync } from "@/hooks/useAsync";
import { fetchCompanies, fetchPitches } from "@/lib/queries";
import { useSeo } from "@/lib/seo";
import { PitchRow } from "@/components/pitchme/PitchRow";
import { EmptyState, ErrorState, LoadingRows } from "@/components/pitchme/states";
import { PUBLIC_STATUSES, STATUS_LABEL, type PitchStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Discover() {
  useSeo({
    title: "Discover feature pitches | PitchMe",
    description:
      "Browse every public feature pitch, filter by company or status, and add your support to the ideas you want built.",
    path: "/discover",
  });

  const [params, setParams] = useSearchParams();
  const companySlug = params.get("company") ?? "";
  const status = (params.get("status") ?? "") as PitchStatus | "";
  const sort = params.get("sort") === "newest" ? "newest" : "support";
  const [query, setQuery] = useState("");

  const companies = useAsync(() => fetchCompanies(), []);
  const pitches = useAsync(() => fetchPitches({ sort }), [sort]);

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    return (pitches.data ?? []).filter((pitch) => {
      if (companySlug && pitch.company.slug !== companySlug) return false;
      if (status && pitch.status !== status) return false;
      if (!text) return true;
      return (
        pitch.title.toLowerCase().includes(text) ||
        pitch.body.toLowerCase().includes(text) ||
        pitch.company.name.toLowerCase().includes(text) ||
        pitch.product.name.toLowerCase().includes(text)
      );
    });
  }, [pitches.data, companySlug, status, query]);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  return (
    <div className="shell py-12">
      <header className="max-w-2xl">
        <p className="eyebrow">Discover</p>
        <h1 className="display mt-3 text-3xl md:text-4xl">Every open pitch</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Support costs nothing and needs no account. Each supporter moves a pitch closer to the
          next milestone.
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-3 border-y border-border py-4 lg:flex-row lg:items-center">
        <div className="flex-1">
          <label htmlFor="search" className="sr-only">
            Search pitches
          </label>
          <input
            id="search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pitches, companies, products"
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-subtle-foreground focus:border-border-strong focus:ring-2 focus:ring-ring/40 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="sr-only" htmlFor="company">
            Filter by company
          </label>
          <select
            id="company"
            value={companySlug}
            onChange={(event) => update("company", event.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:border-border-strong focus:outline-none"
          >
            <option value="">All companies</option>
            {(companies.data ?? []).map((company) => (
              <option key={company.id} value={company.slug}>
                {company.name}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="status">
            Filter by status
          </label>
          <select
            id="status"
            value={status}
            onChange={(event) => update("status", event.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:border-border-strong focus:outline-none"
          >
            <option value="">Any status</option>
            {PUBLIC_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABEL[value]}
              </option>
            ))}
          </select>

          <div
            role="group"
            aria-label="Sort pitches"
            className="inline-flex h-10 items-center rounded-md border border-border p-0.5"
          >
            {(["support", "newest"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => update("sort", value === "support" ? "" : value)}
                aria-pressed={sort === value}
                className={cn(
                  "h-full rounded-[5px] px-3 text-xs font-medium transition-colors",
                  sort === value
                    ? "bg-surface-raised text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {value === "support" ? "Most supported" : "Newest"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="numeric mt-4 text-xs text-subtle-foreground" aria-live="polite">
        {visible.length} {visible.length === 1 ? "pitch" : "pitches"}
      </p>

      <div className="mt-2 border-t border-border">
        {pitches.loading ? (
          <LoadingRows count={8} label="Loading pitches" />
        ) : pitches.error ? (
          <div className="pt-6">
            <ErrorState error={pitches.error} onRetry={pitches.reload} />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState title="Nothing matches those filters" hint="Try a broader search." />
        ) : (
          <div className="divide-y divide-border">
            {visible.map((pitch) => (
              <PitchRow key={pitch.id} pitch={pitch} showBody />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
