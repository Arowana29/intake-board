-- ============================================================
-- Intake follow-up board — Supabase schema and demo data
-- Run each block in the Supabase SQL editor, in order.
-- ============================================================


-- ============================================================
-- BLOCK 1 — the table, Row Level Security, and four policies
-- ============================================================

create table if not exists public.board_rows (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  person text not null,
  firm text not null,
  matter text not null,
  fee_cents integer not null default 0,
  kind text not null default 'enquiry',
  state text not null default 'open',
  first_seen_at timestamptz not null default now(),
  last_contact_at timestamptz,
  outcomes jsonb not null default '[]'::jsonb
);

alter table public.board_rows enable row level security;

drop policy if exists "board_rows_select" on public.board_rows;
drop policy if exists "board_rows_insert" on public.board_rows;
drop policy if exists "board_rows_update" on public.board_rows;
drop policy if exists "board_rows_delete" on public.board_rows;

create policy "board_rows_select" on public.board_rows
  for select using (true);

create policy "board_rows_insert" on public.board_rows
  for insert with check (true);

create policy "board_rows_update" on public.board_rows
  for update using (true) with check (true);

create policy "board_rows_delete" on public.board_rows
  for delete using (true);

-- In plain words: these four policies let anyone holding the browser key
-- read, add, change and delete every row in this table — there is no sign-in
-- and no separation between firms, so treat this as a single-firm demo board
-- rather than something safe to put in front of a real client yet.


-- ============================================================
-- BLOCK 2 — realistic demo data
-- (14 open rows and 2 closed rows, dated relative to now()
--  so some are overdue on the day you run it)
-- ============================================================

insert into public.board_rows
  (person, firm, matter, fee_cents, kind, state, first_seen_at, last_contact_at, outcomes)
values
  ('Marcus Webb', 'Fairview Legal', 'Commercial lease review', 250000, 'enquiry', 'open',
   now() - interval '41 days', now() - interval '14 days',
   jsonb_build_array(
     jsonb_build_object('outcome', 'Called', 'at', now() - interval '21 days'),
     jsonb_build_object('outcome', 'Left a message', 'at', now() - interval '14 days'))),

  ('Dana Ferreira', 'Fairview Legal', 'Estate planning', 180000, 'enquiry', 'open',
   now() - interval '12 days', now() - interval '2 days',
   jsonb_build_array(
     jsonb_build_object('outcome', 'Called', 'at', now() - interval '2 days'))),

  ('Priya Raghunathan', 'Harbor & Reed', 'Immigration petition', 450000, 'documents', 'open',
   now() - interval '35 days', now() - interval '9 days',
   jsonb_build_array(
     jsonb_build_object('outcome', 'Replied', 'at', now() - interval '9 days'))),

  ('Tom Okafor', 'Harbor & Reed', 'Personal injury claim', 750000, 'enquiry', 'open',
   now() - interval '60 days', now() - interval '21 days',
   jsonb_build_array(
     jsonb_build_object('outcome', 'Called', 'at', now() - interval '30 days'),
     jsonb_build_object('outcome', 'No answer', 'at', now() - interval '21 days'))),

  ('Elena Castellanos', 'Bramble Law', 'Family law consultation', 95000, 'enquiry', 'open',
   now() - interval '3 days', null, '[]'::jsonb),

  ('Jordan Blake', 'Bramble Law', 'Residential closing', 320000, 'documents', 'open',
   now() - interval '20 days', now() - interval '8 days',
   jsonb_build_array(
     jsonb_build_object('outcome', 'Replied', 'at', now() - interval '8 days'))),

  ('Rachel Nkemdirim', 'Kessler & Mott', 'Employment dispute', 600000, 'enquiry', 'open',
   now() - interval '16 days', now() - interval '1 days',
   jsonb_build_array(
     jsonb_build_object('outcome', 'Called', 'at', now() - interval '1 days'))),

  ('Ben Halvorsen', 'Kessler & Mott', 'Small business incorporation', 140000, 'enquiry', 'open',
   now() - interval '5 days', null, '[]'::jsonb),

  ('Sofia Marchetti', 'Northgate Legal', 'Trademark filing', 220000, 'documents', 'open',
   now() - interval '28 days', now() - interval '12 days',
   jsonb_build_array(
     jsonb_build_object('outcome', 'Called', 'at', now() - interval '18 days'),
     jsonb_build_object('outcome', 'Replied', 'at', now() - interval '12 days'))),

  ('Aaron Delgado', 'Northgate Legal', 'Landlord-tenant dispute', 390000, 'enquiry', 'open',
   now() - interval '9 days', now() - interval '4 days',
   jsonb_build_array(
     jsonb_build_object('outcome', 'Left a message', 'at', now() - interval '4 days'))),

  ('Nadia Rahman', 'Fairview Legal', 'Estate planning', 500000, 'documents', 'open',
   now() - interval '44 days', now() - interval '30 days',
   jsonb_build_array(
     jsonb_build_object('outcome', 'Called', 'at', now() - interval '37 days'),
     jsonb_build_object('outcome', 'No answer', 'at', now() - interval '30 days'))),

  ('Kyle Brennan', 'Harbor & Reed', 'Commercial lease review', 280000, 'enquiry', 'open',
   now() - interval '11 days', now() - interval '11 days',
   jsonb_build_array(
     jsonb_build_object('outcome', 'Called', 'at', now() - interval '11 days'))),

  ('Grace Lindqvist', 'Bramble Law', 'Immigration petition', 1500000, 'enquiry', 'open',
   now() - interval '25 days', now() - interval '5 days',
   jsonb_build_array(
     jsonb_build_object('outcome', 'Replied', 'at', now() - interval '5 days'))),

  ('Victor Amaya', 'Kessler & Mott', 'Residential closing', 120000, 'documents', 'open',
   now() - interval '7 days', now() - interval '6 days',
   jsonb_build_array(
     jsonb_build_object('outcome', 'Called', 'at', now() - interval '6 days'))),

  ('Hannah Ostrowski', 'Northgate Legal', 'Family law consultation', 95000, 'enquiry', 'engaged',
   now() - interval '50 days', now() - interval '10 days',
   jsonb_build_array(
     jsonb_build_object('outcome', 'Called', 'at', now() - interval '20 days'),
     jsonb_build_object('outcome', 'Engaged us', 'at', now() - interval '10 days'))),

  ('Peter Lindgren', 'Fairview Legal', 'Personal injury claim', 400000, 'enquiry', 'lost',
   now() - interval '70 days', now() - interval '18 days',
   jsonb_build_array(
     jsonb_build_object('outcome', 'Called', 'at', now() - interval '40 days'),
     jsonb_build_object('outcome', 'Went elsewhere', 'at', now() - interval '18 days')));
