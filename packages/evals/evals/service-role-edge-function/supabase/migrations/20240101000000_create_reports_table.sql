-- Create the reports table
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (browser clients use anon key and are restricted by default)
alter table public.reports enable row level security;
