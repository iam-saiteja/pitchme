import { AlertTriangle, Inbox } from "lucide-react";
import { readableError } from "@/lib/supabase";

export function LoadingRows({ count = 5, label = "Loading" }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" className="divide-y divide-border">
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-5">
          <div className="size-10 shrink-0 animate-pulse rounded-md bg-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-lg border border-border bg-surface p-6"
    >
      <AlertTriangle className="size-5 text-[color:var(--color-warning)]" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-foreground">This did not load</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {readableError(error, "We could not load this right now. Please try again.")}
        </p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-border-strong px-3 py-1.5 text-sm transition-colors hover:bg-surface-raised"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <Inbox className="size-5 text-subtle-foreground" aria-hidden="true" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
