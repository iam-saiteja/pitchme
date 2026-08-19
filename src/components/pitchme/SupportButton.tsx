import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { supportPitch } from "@/lib/queries";
import { readableError } from "@/lib/supabase";
import { formatCount, plural } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SupportButton({
  pitchId,
  count,
  supported,
  onChange,
  disabled,
}: {
  pitchId: string;
  count: number;
  supported: boolean;
  onChange: (next: { count: number; supported: boolean }) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (supported || busy || disabled) return;
    setBusy(true);
    try {
      const next = await supportPitch(pitchId);
      onChange({ count: next || count + 1, supported: true });
    } catch (error) {
      toast.error(readableError(error, "Your support could not be recorded. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={supported || busy || disabled}
        aria-pressed={supported}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-medium transition-all duration-200",
          supported
            ? "cursor-default border border-border bg-surface text-foreground"
            : "bg-accent text-accent-foreground hover:brightness-105 active:scale-[0.98]",
          busy && "opacity-70",
        )}
      >
        {supported ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <Plus className="size-4" aria-hidden="true" />
        )}
        {supported ? "Supported" : busy ? "Saving" : "I want this too"}
      </button>

      <p className="numeric text-sm text-foreground" aria-live="polite">
        {formatCount(count)}{" "}
        <span className="font-sans text-xs text-muted-foreground">
          {plural(count, "supporter")}
        </span>
      </p>
    </div>
  );
}
