import { cn } from "@/lib/utils";
import { STATUS_LABEL, type PitchStatus } from "@/lib/types";

const TONE: Record<PitchStatus, string> = {
  pending: "text-muted-foreground",
  open: "text-muted-foreground",
  contacted: "text-[color:var(--color-info)]",
  responded: "text-[color:var(--color-accent)]",
  planned: "text-[color:var(--color-accent)]",
  in_progress: "text-[color:var(--color-info)]",
  shipped: "text-[color:var(--color-success)]",
  declined: "text-[color:var(--color-destructive)]",
};

const SHAPE: Record<PitchStatus, string> = {
  pending: "rounded-full",
  open: "rounded-full",
  contacted: "rounded-full",
  responded: "rounded-full",
  planned: "rounded-full",
  in_progress: "rounded-full",
  shipped: "rounded-[2px]",
  declined: "rounded-[2px]",
};

/**
 * State is carried by the written label plus a dot shape, not colour alone.
 */
export function StatusBadge({ status, className }: { status: PitchStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap",
        TONE[status],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 bg-current", SHAPE[status])}
        style={{ opacity: status === "open" || status === "pending" ? 0.55 : 1 }}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}
