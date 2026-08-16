# PitchMe

**Pitch a better product. Get people behind it. Let the company hear it.**

PitchMe is a public feedback layer for products and the people who use them.

Users do not need accounts. They can create a pitch, support existing ideas, react, and follow the public status of a request. The first release keeps company outreach intentionally human: approved pitches are sent manually at meaningful supporter milestones.

## Product loop

1. Someone notices something a product is missing.
2. They create a pitch without creating an account.
3. The pitch is reviewed before publication.
4. Other people support and react to it.
5. At supporter milestones — **1, 25, 50, 100, 500, 1000** — the admin can manually contact the company.
6. If the company responds, the response can be published on the same pitch.
7. The community can react to the response.

The public supporter count continues past 1000; the milestone list controls outreach, not visibility.

## Stack

- React + TypeScript + Vite
- Supabase Postgres + Auth
- Cloudflare Pages
- Manual company email workflow for V1

## Local development

```bash
npm install
npm run dev
```

Create a `.env.local` from the following values:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The app currently ships with seed data so the public interface is usable before the Supabase project is connected.

## Supabase

Run `supabase/schema.sql` in the Supabase SQL editor. Then add the environment variables above to the Cloudflare Pages project.

The schema keeps public reads open for published content while sensitive administration remains an authenticated path. Support events are deduplicated by a client fingerprint through the `increment_support` database function.

## Cloudflare Pages

Build command:

```text
npm run build
```

Output directory:

```text
dist
```

No paid server is required for the public application.

## Manual outreach

The initial release intentionally does **not** send company emails automatically. Admin records each milestone email manually so the project can learn from real usage before introducing automation.

Suggested email milestones per pitch:

```text
1 → 25 → 50 → 100 → 500 → 1000
```

## Privacy and moderation

PitchMe is designed to work without user accounts. The project should not ask users for unnecessary personal information. Before public launch, add rate limiting / abuse prevention around anonymous submissions, support actions, reactions, and comments.

Company pages are community-facing and do not imply endorsement or affiliation unless explicitly marked as verified in a future release.
