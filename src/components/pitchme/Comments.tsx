import { useState } from "react";
import { toast } from "sonner";
import { fetchApprovedComments, submitComment } from "@/lib/queries";
import { readableError } from "@/lib/supabase";
import { relativeDate } from "@/lib/format";
import type { Comment } from "@/lib/types";

const MAX = 800;

export function Comments({
  pitchId,
  comments,
  onRefresh,
}: {
  pitchId: string;
  comments: Comment[];
  onRefresh: (next: Comment[]) => void;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (text.length < 3) {
      toast.error("Please write a little more before posting.");
      return;
    }
    setBusy(true);
    try {
      await submitComment(pitchId, text);
      setBody("");
      toast.success("Thanks. Your comment goes live once a moderator reviews it.");
      onRefresh(await fetchApprovedComments(pitchId));
    } catch (error) {
      toast.error(readableError(error, "Your comment could not be posted."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="discussion" className="mt-12">
      <h2 id="discussion" className="text-sm font-semibold tracking-tight text-foreground">
        Discussion
        <span className="numeric ml-2 font-normal text-subtle-foreground">{comments.length}</span>
      </h2>

      <form onSubmit={handleSubmit} className="mt-4">
        <label htmlFor="comment" className="sr-only">
          Add a comment
        </label>
        <textarea
          id="comment"
          value={body}
          maxLength={MAX}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          placeholder="Add context, a use case, or a workaround you have tried."
          className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-subtle-foreground focus:border-border-strong focus:ring-2 focus:ring-ring/40 focus:outline-none"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-subtle-foreground">
            Posted anonymously. Comments are reviewed before they appear.
          </p>
          <div className="flex items-center gap-3">
            <span className="numeric text-xs text-subtle-foreground">
              {body.length}/{MAX}
            </span>
            <button
              type="submit"
              disabled={busy}
              className="min-h-10 rounded-md border border-border-strong px-4 text-sm font-medium transition-colors hover:bg-surface-raised disabled:opacity-60"
            >
              {busy ? "Posting" : "Post comment"}
            </button>
          </div>
        </div>
      </form>

      {comments.length > 0 ? (
        <ul className="mt-8 divide-y divide-border border-t border-border">
          {comments.map((comment) => (
            <li key={comment.id} className="py-4">
              <p className="flex items-center gap-2 text-xs text-subtle-foreground">
                <span className="font-medium text-muted-foreground">
                  {comment.display_name?.trim() || "Anonymous"}
                </span>
                <time dateTime={comment.created_at}>{relativeDate(comment.created_at)}</time>
              </p>
              <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                {comment.body}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
          No comments yet. Be the first to add context.
        </p>
      )}
    </section>
  );
}
