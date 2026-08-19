import { Link } from "react-router-dom";
import { CompanyLogo } from "./CompanyLogo";
import { StatusBadge } from "./StatusBadge";
import { pitchPath } from "@/lib/queries";
import { formatCount, plural } from "@/lib/format";
import type { PitchWithContext } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Dense editorial row used across the homepage, discover feed and company page.
 */
export function PitchRow({
  pitch,
  rank,
  showBody = false,
  className,
  style,
}: {
  pitch: PitchWithContext;
  rank?: number;
  showBody?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <article
      className={cn("group relative py-5 transition-colors hover:bg-surface/60", className)}
      style={style}
    >
      <div className="flex items-start gap-4 px-1">
        {typeof rank === "number" ? (
          <span
            aria-hidden="true"
            className="numeric mt-0.5 w-6 shrink-0 text-right text-sm text-subtle-foreground"
          >
            {rank}
          </span>
        ) : null}

        <CompanyLogo company={pitch.company} size="md" className="mt-0.5" />

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">{pitch.company.name}</span>
            <span aria-hidden="true" className="text-subtle-foreground">
              /
            </span>
            <span>{pitch.product.name}</span>
          </p>

          <h3 className="mt-1 text-[15px] leading-snug font-medium break-words text-foreground">
            <Link to={pitchPath(pitch)} className="after:absolute after:inset-0">
              {pitch.title}
            </Link>
          </h3>

          {showBody ? (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {pitch.body}
            </p>
          ) : null}

          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="numeric text-sm text-foreground">
              {formatCount(pitch.support_count)}{" "}
              <span className="font-sans text-xs text-muted-foreground">
                {plural(pitch.support_count, "supporter")}
              </span>
            </span>
            <StatusBadge status={pitch.status} />
          </div>
        </div>
      </div>
    </article>
  );
}
