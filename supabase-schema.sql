-- Run this in your Supabase project: SQL Editor → New query → paste → Run

create table public.reading_progress (
  user_id uuid references auth.users(id) on delete cascade not null primary key,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.exercise_progress (
  user_id uuid references auth.users(id) on delete cascade not null primary key,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.vocab_progress (
  user_id uuid references auth.users(id) on delete cascade not null primary key,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.reading_progress enable row level security;
alter table public.exercise_progress enable row level security;
alter table public.vocab_progress enable row level security;

create policy "own reading" on public.reading_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own exercises" on public.exercise_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own vocab" on public.vocab_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
