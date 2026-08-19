import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAsync } from "@/hooks/useAsync";
import { fetchCompanyDirectory } from "@/lib/queries";
import { useSeo } from "@/lib/seo";
import { formatCount, plural } from "@/lib/format";
import { CompanyLogo } from "@/components/pitchme/CompanyLogo";
import { EmptyState, ErrorState, LoadingRows } from "@/components/pitchme/states";

export default function Companies() {
  useSeo({
    title: "Company directory | PitchMe",
    description:
      "Every company tracked on PitchMe, with the number of products, open feature pitches, and total public supporters behind them.",
    path: "/companies",
  });

  const directory = useAsync(() => fetchCompanyDirectory(), []);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return directory.data ?? [];
    return (directory.data ?? []).filter((row) => row.company.name.toLowerCase().includes(text));
  }, [directory.data, query]);

  return (
    <div className="shell py-12">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p className="eyebrow">Directory</p>
          <h1 className="display mt-3 text-3xl md:text-4xl">Companies on PitchMe</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Ranked by the total public support behind their open pitches.
          </p>
        </div>

        <div className="md:w-72">
          <label htmlFor="company-search" className="sr-only">
            Search companies
          </label>
          <input
            id="company-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search companies"
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-subtle-foreground focus:border-border-strong focus:ring-2 focus:ring-ring/40 focus:outline-none"
          />
        </div>
      </header>

      <div className="mt-8 border-t border-border">
        {directory.loading ? (
          <LoadingRows count={8} label="Loading companies" />
        ) : directory.error ? (
          <div className="pt-6">
            <ErrorState error={directory.error} onRetry={directory.reload} />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState title="No companies match that search" />
        ) : (
          <ul className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((row) => (
              <li key={row.company.id} className="bg-background">
                <Link
                  to={`/company/${row.company.slug}`}
                  className="group flex h-full flex-col gap-4 p-5 transition-colors hover:bg-surface/70"
                >
                  <div className="flex items-start gap-3">
                    <CompanyLogo company={row.company} size="lg" />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-[15px] font-medium text-foreground">
                        {row.company.name}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {row.company.description ||
                          `${row.product_count} ${plural(row.product_count, "product")} tracked on PitchMe.`}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-auto flex items-baseline gap-6 border-t border-border pt-3">
                    <div>
                      <dt className="eyebrow">Pitches</dt>
                      <dd className="numeric mt-0.5 text-sm text-foreground">
                        {formatCount(row.pitch_count)}
                      </dd>
                    </div>
                    <div>
                      <dt className="eyebrow">Supporters</dt>
                      <dd className="numeric mt-0.5 text-sm text-foreground">
                        {formatCount(row.supporter_total)}
                      </dd>
                    </div>
                    <div>
                      <dt className="eyebrow">Products</dt>
                      <dd className="numeric mt-0.5 text-sm text-foreground">
                        {formatCount(row.product_count)}
                      </dd>
                    </div>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
