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

create table if not exists public.five_year_leaderboard (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slot_number int not null check (slot_number between 1 and 3),
  campaign_seed int not null,
  group_name text not null,
  company_name text not null,
  score int not null check (score >= 0),
  achieved_routes text[] not null default '{}',
  review_record jsonb not null,
  recorded_at timestamptz not null default now(),
  unique (user_id, slot_number, campaign_seed)
);

create index if not exists five_year_leaderboard_score_idx
on public.five_year_leaderboard (score desc, recorded_at asc);

alter table public.five_year_leaderboard enable row level security;

drop policy if exists "Authenticated players can view five year records"
on public.five_year_leaderboard;

drop policy if exists "Players can add own five year records"
on public.five_year_leaderboard;

revoke all on table public.five_year_leaderboard from anon, authenticated;

create or replace view public.five_year_leaderboard_public
with (security_invoker = false)
as
select
  id,
  group_name,
  company_name,
  score,
  achieved_routes,
  review_record,
  recorded_at
from public.five_year_leaderboard;

revoke all on table public.five_year_leaderboard_public from anon, authenticated;
grant select on table public.five_year_leaderboard_public to authenticated;

create or replace function public.record_five_year_leaderboard_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  review jsonb;
begin
  review := new.save_data #> '{gameStore,fiveYearReview}';
  if review is null or review = 'null'::jsonb then
    return new;
  end if;

  insert into public.five_year_leaderboard (
    user_id,
    slot_number,
    campaign_seed,
    group_name,
    company_name,
    score,
    achieved_routes,
    review_record
  ) values (
    new.user_id,
    new.slot_number,
    coalesce((new.save_data #>> '{gameStore,campaignSeed}')::int, 0),
    new.group_name,
    coalesce(new.save_data #>> '{gameStore,companyName}', ''),
    coalesce((review ->> 'score')::int, 0),
    array(
      select jsonb_array_elements_text(
        coalesce(review -> 'achievedRoutes', '[]'::jsonb)
      )
    ),
    review
  )
  on conflict (user_id, slot_number, campaign_seed) do nothing;

  return new;
end;
$$;

revoke execute on function public.record_five_year_leaderboard_entry()
from public;

drop trigger if exists saves_record_five_year_leaderboard on public.saves;

create trigger saves_record_five_year_leaderboard
after insert or update on public.saves
for each row
execute function public.record_five_year_leaderboard_entry();
