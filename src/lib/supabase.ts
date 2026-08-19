import { createClient } from "@supabase/supabase-js";

/**
 * Existing PitchMe Supabase project. Only the publishable (anon) key is used in
 * the browser. Row level security decides what an anonymous visitor may read.
 */
const url = import.meta.env["VITE_SUPABASE_URL"] ?? "https://zoqasywuvojthzckvurb.supabase.co";
const publishableKey =
  import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
  "sb_publishable_0m26_WLYaD-GnXx2Y897-w_R6jxpIZ6";

export const supabase = createClient(url, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "pitchme-auth",
  },
});

/** Turns any Supabase/network failure into copy a normal visitor can read. */
export function readableError(error: unknown, fallback = "Something went wrong."): string {
  if (!error) return fallback;
  const raw =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : typeof error === "object" && "message" in error
          ? String((error as { message: unknown }).message)
          : "";

  if (!raw) return fallback;
  if (/fetch|network|failed to fetch/i.test(raw)) {
    return "We could not reach PitchMe right now. Check your connection and try again.";
  }
  if (/jwt|unauthor|permission|denied|row-level/i.test(raw)) {
    return "You do not have permission to do that.";
  }
  if (/duplicate|unique|conflict/i.test(raw)) {
    return "That already exists.";
  }
  // Never surface raw SQL or PostgREST internals to a normal visitor.
  if (/^[A-Z0-9]{5}$/.test(raw) || /relation|column|syntax|pgrst/i.test(raw)) {
    return fallback;
  }
  return raw;
}
