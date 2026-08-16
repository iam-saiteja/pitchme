-- PitchMe database schema
-- Run this in the Supabase SQL editor.

create extension if not exists pgcrypto;

create type pitch_status as enum (
  'pending', 'open', 'contacted', 'responded', 'planned', 'in_progress', 'shipped', 'declined'
);

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  website text,
  logo_url text,
  description text,
  contact_email text,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique(company_id, slug)
);

create table pitches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  product_id uuid not null references products(id),
  title text not null check (char_length(title) between 8 and 140),
  slug text not null,
  body text not null check (char_length(body) between 20 and 2000),
  status pitch_status not null default 'pending',
  support_count bigint not null default 0,
  submitter_note text,
  moderation_note text,
  email_milestones_sent int[] not null default '{}',
  last_email_milestone int,
  contacted_at timestamptz,
  company_response text,
  company_response_verified boolean not null default false,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, product_id, slug)
);

create table supports (
  id uuid primary key default gen_random_uuid(),
  pitch_id uuid not null references pitches(id) on delete cascade,
  fingerprint text not null,
  created_at timestamptz not null default now(),
  unique(pitch_id, fingerprint)
);

create type reaction_kind as enum ('supportive', 'love', 'fire', 'helpful', 'agree', 'not_enough');

create table pitch_reactions (
  id uuid primary key default gen_random_uuid(),
  pitch_id uuid not null references pitches(id) on delete cascade,
  fingerprint text not null,
  reaction reaction_kind not null,
  created_at timestamptz not null default now(),
  unique(pitch_id, fingerprint)
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  pitch_id uuid not null references pitches(id) on delete cascade,
  fingerprint text not null,
  body text not null check (char_length(body) between 1 and 1000),
  display_name text,
  approved boolean not null default true,
  created_at timestamptz not null default now()
);

create table company_responses (
  id uuid primary key default gen_random_uuid(),
  pitch_id uuid not null references pitches(id) on delete cascade,
  body text not null,
  verified boolean not null default false,
  received_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table email_milestone_events (
  id uuid primary key default gen_random_uuid(),
  pitch_id uuid not null references pitches(id) on delete cascade,
  milestone int not null check (milestone in (1,25,50,100,500,1000)),
  approved_by uuid,
  sent_at timestamptz not null default now(),
  notes text,
  unique(pitch_id, milestone)
);

create index pitches_company_idx on pitches(company_id);
create index pitches_product_idx on pitches(product_id);
create index pitches_support_count_idx on pitches(support_count desc);
create index pitches_status_idx on pitches(status);
create index comments_pitch_idx on comments(pitch_id, created_at desc);

-- Public reads are allowed; writes go through controlled RPCs / admin flows.
alter table companies enable row level security;
alter table products enable row level security;
alter table pitches enable row level security;
alter table comments enable row level security;
alter table company_responses enable row level security;
alter table supports enable row level security;
alter table pitch_reactions enable row level security;
alter table email_milestone_events enable row level security;

create policy "public can read companies" on companies for select using (true);
create policy "public can read products" on products for select using (true);
create policy "public can read published pitches" on pitches for select using (status <> 'pending');
create policy "public can read approved comments" on comments for select using (approved = true);
create policy "public can read verified responses" on company_responses for select using (verified = true and published_at is not null);

-- Anonymous clients are allowed to create support records. The fingerprint is generated client-side.
create policy "public can support" on supports for insert with check (true);
create policy "public can react" on pitch_reactions for insert with check (true);
create policy "public can comment" on comments for insert with check (true);

create or replace function increment_support(p_pitch_id uuid, p_fingerprint text)
returns bigint
language plpgsql
security definer
as $$
declare
  new_count bigint;
begin
  insert into supports(pitch_id, fingerprint)
  values (p_pitch_id, p_fingerprint)
  on conflict (pitch_id, fingerprint) do nothing;

  if found then
    update pitches
      set support_count = support_count + 1,
          updated_at = now()
      where id = p_pitch_id
      returning support_count into new_count;
  else
    select support_count into new_count from pitches where id = p_pitch_id;
  end if;

  return new_count;
end;
$$;

revoke all on function increment_support(uuid, text) from public;
grant execute on function increment_support(uuid, text) to anon, authenticated;

insert into companies (name, slug, description) values
  ('Google', 'google', 'Products we use every day.'),
  ('Spotify', 'spotify', 'Music and audio products.'),
  ('WhatsApp', 'whatsapp', 'Simple, reliable private messaging.')
on conflict (slug) do nothing;

insert into products (company_id, name, slug)
select c.id, x.name, x.slug
from companies c
join (values
  ('Google', 'Google Contacts', 'contacts'),
  ('Spotify', 'Spotify', 'spotify'),
  ('WhatsApp', 'WhatsApp', 'whatsapp')
) as x(company_name, name, slug) on x.company_name = c.name
on conflict (company_id, slug) do nothing;
