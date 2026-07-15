create extension if not exists pgcrypto;

create table if not exists public.saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slot_number int not null check (slot_number between 1 and 3),
  save_data jsonb not null,
  save_name text not null,
  played_weeks int not null,
  current_phase text not null,
  group_name text not null,
  save_revision bigint not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, slot_number)
);

-- Existing installations need the revision column as well. Every client save
-- sends a larger revision; older or delayed requests are rejected below.
alter table public.saves
add column if not exists save_revision bigint not null default 0;

create index if not exists saves_user_id_idx on public.saves (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists saves_set_updated_at on public.saves;

create trigger saves_set_updated_at
before update on public.saves
for each row
execute function public.set_updated_at();

create or replace function public.reject_stale_save()
returns trigger
language plpgsql
as $$
begin
  if new.save_revision <= old.save_revision then
    raise exception 'stale save revision: incoming %, current %',
      new.save_revision,
      old.save_revision
      using errcode = '40001';
  end if;
  return new;
end;
$$;

drop trigger if exists saves_reject_stale_revision on public.saves;

create trigger saves_reject_stale_revision
before update on public.saves
for each row
execute function public.reject_stale_save();

alter table public.saves enable row level security;

drop policy if exists "Users can manage own saves" on public.saves;

create policy "Users can manage own saves"
on public.saves
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
