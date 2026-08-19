import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LogoCompany {
  name: string;
  slug: string;
  logo_url?: string | null;
  website?: string | null;
}

const SIZES = {
  sm: "size-7 text-[11px]",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
  xl: "size-20 text-2xl",
} as const;

/**
 * Simple Icons serves black glyphs by default, which are invisible on a dark
 * surface. Requesting an explicit colour keeps every logo legible without
 * changing the stored metadata.
 */
function normalize(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.includes("cdn.simpleicons.org")) return url;
  const trimmed = url.replace(/\/+$/, "");
  const parts = trimmed.split("/");
  // .../{slug} -> add colour, .../{slug}/{colour} -> leave as is
  const tail = parts[parts.length - 1] ?? "";
  const hasColour = /^[0-9a-f]{3,8}$/i.test(tail) || tail === "white";
  return hasColour ? trimmed : `${trimmed}/white`;
}

/**
 * Several brands have been withdrawn from Simple Icons, so the primary URL
 * 404s. The site favicon is a dependable second source before we fall back to
 * a plain initial.
 */
function faviconFor(company: LogoCompany): string | null {
  const raw = company.website?.trim();
  let domain = "";
  if (raw) {
    try {
      domain = new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname;
    } catch {
      domain = "";
    }
  }
  if (!domain && company.slug) domain = `${company.slug}.com`;
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}


export function CompanyLogo({
  company,
  size = "md",
  className,
}: {
  company: LogoCompany;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const sources = [normalize(company.logo_url), faviconFor(company)].filter(
    (value): value is string => Boolean(value),
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [company.logo_url, company.website, company.slug]);

  const src = sources[index] ?? null;
  const initial = (company.name?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-raised",
        SIZES[size],
        className,
      )}
    >
      {src ? (
        <img
          key={src}
          src={src}
          alt={`${company.name} logo`}
          loading="lazy"
          decoding="async"
          width={64}
          height={64}
          onError={() => setIndex((current) => current + 1)}
          className="size-[60%] object-contain"
        />
      ) : (

        // Never a broken image icon: a clean initial stands in.
        <span aria-hidden="true" className="font-medium text-muted-foreground">
          {initial}
        </span>
      )}
    </span>
  );
}
