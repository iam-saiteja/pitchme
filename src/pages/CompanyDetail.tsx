import { Link, useParams } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { fetchCompanyBySlug, fetchPitches, fetchProducts } from "@/lib/queries";
import { useSeo, truncateForMeta } from "@/lib/seo";
import { formatCount, plural } from "@/lib/format";
import { CompanyLogo } from "@/components/pitchme/CompanyLogo";
import { PitchRow } from "@/components/pitchme/PitchRow";
import { EmptyState, ErrorState, LoadingRows } from "@/components/pitchme/states";
import NotFound from "./NotFound";

export default function CompanyDetail() {
  const { slug = "" } = useParams();
  const company = useAsync(() => fetchCompanyBySlug(slug), [slug]);
  const products = useAsync(
    async () => (company.data ? fetchProducts(company.data.id) : []),
    [company.data?.id],
  );
  const pitches = useAsync(
    async () => (company.data ? fetchPitches({ companyId: company.data.id }) : []),
    [company.data?.id],
  );

  const name = company.data?.name ?? "Company";
  const supporterTotal = (pitches.data ?? []).reduce((sum, p) => sum + (p.support_count ?? 0), 0);

  useSeo({
    title: company.data ? `${name} feature requests | PitchMe` : "Company | PitchMe",
    description: truncateForMeta(
      company.data?.description ||
        `See what people are asking ${name} to build next, and add your support to the pitches you want shipped.`,
    ),
    path: `/company/${slug}`,
  });

  if (!company.loading && !company.error && !company.data) {
    return <NotFound />;
  }

  return (
    <div className="shell py-12">
      {company.error ? (
        <ErrorState error={company.error} onRetry={company.reload} />
      ) : company.loading || !company.data ? (
        <LoadingRows count={4} label="Loading company" />
      ) : (
        <>
          <nav aria-label="Breadcrumb" className="text-xs text-subtle-foreground">
            <Link to="/companies" className="transition-colors hover:text-foreground">
              Companies
            </Link>
            <span aria-hidden="true" className="px-2">
              /
            </span>
            <span className="text-muted-foreground">{name}</span>
          </nav>

          <header className="mt-6 flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-5">
              <CompanyLogo company={company.data} size="xl" />
              <div className="min-w-0">
                <h1 className="display text-3xl md:text-4xl">{name}</h1>
                {company.data.description ? (
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {company.data.description}
                  </p>
                ) : null}
                {company.data.website ? (
                  <a
                    href={company.data.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
                  >
                    {company.data.website.replace(/^https?:\/\//, "")}
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </div>

            <dl className="flex gap-8 md:flex-col md:gap-4 md:text-right">
              <div>
                <dt className="eyebrow">Pitches</dt>
                <dd className="numeric mt-1 text-2xl text-foreground">
                  {formatCount((pitches.data ?? []).length)}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Supporters</dt>
                <dd className="numeric mt-1 text-2xl text-foreground">
                  {formatCount(supporterTotal)}
                </dd>
              </div>
            </dl>
          </header>

          {(products.data ?? []).length > 0 ? (
            <section aria-labelledby="products" className="mt-8">
              <h2 id="products" className="eyebrow">
                Products ({(products.data ?? []).length})
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {(products.data ?? []).map((product) => (
                  <li
                    key={product.id}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground"
                  >
                    {product.name}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="company-pitches" className="mt-12">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="company-pitches" className="text-sm font-semibold tracking-tight">
                Open pitches
              </h2>
              <Link
                to="/submit"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Pitch a feature
              </Link>
            </div>

            <div className="mt-4 border-t border-border">
              {pitches.loading ? (
                <LoadingRows count={5} label="Loading pitches" />
              ) : pitches.error ? (
                <div className="pt-6">
                  <ErrorState error={pitches.error} onRetry={pitches.reload} />
                </div>
              ) : (pitches.data ?? []).length === 0 ? (
                <EmptyState
                  title={`No public pitches for ${name} yet`}
                  hint="Submit the first one and gather support."
                />
              ) : (
                <div className="divide-y divide-border">
                  {(pitches.data ?? []).map((pitch, index) => (
                    <PitchRow key={pitch.id} pitch={pitch} rank={index + 1} showBody />
                  ))}
                </div>
              )}
            </div>
          </section>

          <p className="mt-12 border-t border-border pt-6 text-xs leading-relaxed text-subtle-foreground">
            {name} and its logo are trademarks of their owner. PitchMe is an independent community
            project and is not affiliated with or endorsed by {name}.
            {company.data.logo_source ? (
              <>
                {" "}
                Logo via{" "}
                {company.data.logo_source_url ? (
                  <a
                    href={company.data.logo_source_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline decoration-border underline-offset-4 hover:text-muted-foreground"
                  >
                    {company.data.logo_source}
                  </a>
                ) : (
                  company.data.logo_source
                )}
                .
              </>
            ) : null}{" "}
            {(pitches.data ?? []).length} {plural((pitches.data ?? []).length, "pitch", "pitches")}{" "}
            listed.
          </p>
        </>
      )}
    </div>
  );
}
