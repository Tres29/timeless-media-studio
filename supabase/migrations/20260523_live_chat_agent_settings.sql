-- Timeless Media Studio live chat agent settings update
-- Run this in Supabase SQL Editor before using the updated dashboard.

create table if not exists public.chat_agent_settings (
  id uuid primary key default gen_random_uuid(),
  agent_email text unique not null,
  agent_name text not null default 'Agent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chat_conversations
  add column if not exists assigned_agent_name text;

alter table public.chat_conversations
  add column if not exists ended_by text;

alter table public.chat_conversations
  add column if not exists ended_at timestamptz;

create index if not exists chat_conversations_assigned_agent_name_idx
  on public.chat_conversations (assigned_agent_name);

create index if not exists chat_agent_settings_agent_email_idx
  on public.chat_agent_settings (agent_email);

alter table public.chat_agent_settings enable row level security;

drop policy if exists "Authenticated users can read chat agent settings" on public.chat_agent_settings;
create policy "Authenticated users can read chat agent settings"
on public.chat_agent_settings
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can upsert chat agent settings" on public.chat_agent_settings;
create policy "Authenticated users can upsert chat agent settings"
on public.chat_agent_settings
for all
to authenticated
using (true)
with check (true);
