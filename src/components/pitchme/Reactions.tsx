import { useState } from "react";
import { toast } from "sonner";
import { reactToPitch } from "@/lib/queries";
import { readableError } from "@/lib/supabase";
import { REACTIONS, type ReactionKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Reactions({
  pitchId,
  current,
  counts,
  onChange,
}: {
  pitchId: string;
  current: ReactionKind | null;
  counts: Partial<Record<ReactionKind, number>>;
  onChange: (next: ReactionKind) => void;
}) {
  const [busy, setBusy] = useState<ReactionKind | null>(null);

  async function pick(kind: ReactionKind) {
    if (busy || current === kind) return;
    setBusy(kind);
    try {
      await reactToPitch(pitchId, kind);
      onChange(kind);
    } catch (error) {
      toast.error(readableError(error, "That reaction could not be saved."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-subtle-foreground">How useful is this?</span>
      {REACTIONS.map((reaction) => {
        const active = current === reaction.kind;
        const count = counts[reaction.kind] ?? 0;
        return (
          <button
            key={reaction.kind}
            type="button"
            onClick={() => pick(reaction.kind)}
            aria-pressed={active}
            disabled={busy !== null}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors",
              active
                ? "border-accent/50 bg-accent/10 text-foreground"
                : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
            )}
          >
            <span aria-hidden="true">{reaction.emoji}</span>
            {reaction.label}
            {count > 0 ? <span className="numeric text-subtle-foreground">{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
