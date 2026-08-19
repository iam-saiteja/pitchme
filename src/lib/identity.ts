const KEY = "pitchme.visitor";

/**
 * One anonymous identifier per browser. The database, not localStorage, decides
 * whether this visitor already supported or reacted to a pitch.
 */
export function visitorId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing && existing.length >= 16) return existing;
    const fresh =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    window.localStorage.setItem(KEY, fresh);
    return fresh;
  } catch {
    // Private mode or blocked storage: stay usable for this session only.
    return "ephemeral-visitor";
  }
}
