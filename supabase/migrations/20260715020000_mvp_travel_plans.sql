-- Hackathon MVP travel-plan storage for the custom public.mvp_users login.
-- The browser session is intentionally localStorage-based, so p_owner_id is
-- an ownership label rather than a server-verifiable authentication claim.

create table if not exists public.mvp_travel_plans (
  id uuid primary key,
  owner_id uuid not null references public.mvp_users(id) on delete cascade,
  title text not null,
  destination_name text not null,
  travel_date date not null,
  return_date date,
  status text not null default 'draft' check (status in ('draft', 'complete')),
  plan_data jsonb not null check (jsonb_typeof(plan_data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mvp_travel_plans_owner_updated_idx
  on public.mvp_travel_plans (owner_id, updated_at desc);

alter table public.mvp_travel_plans enable row level security;
revoke all on table public.mvp_travel_plans from public, anon, authenticated;

create or replace function public.save_mvp_travel_plan(
  p_owner_id uuid,
  p_plan jsonb
)
returns table (
  id uuid,
  owner_id uuid,
  plan_data jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  plan_id uuid;
  plan_title text;
  destination_name_value text;
  travel_date_value date;
  return_date_value date;
  status_value text;
  saved_plan public.mvp_travel_plans%rowtype;
begin
  if p_owner_id is null or not exists (
    select 1 from public.mvp_users as app_user where app_user.id = p_owner_id
  ) then
    raise exception '로그인 사용자 정보를 찾을 수 없습니다.' using errcode = 'P0001';
  end if;

  if p_plan is null or jsonb_typeof(p_plan) <> 'object' then
    raise exception '저장할 여행 계획 형식이 올바르지 않습니다.' using errcode = '22023';
  end if;

  begin
    plan_id := nullif(p_plan ->> 'id', '')::uuid;
    travel_date_value := nullif(p_plan ->> 'travelDate', '')::date;
    return_date_value := nullif(p_plan ->> 'returnDate', '')::date;
  exception
    when invalid_text_representation or datetime_field_overflow then
      raise exception '여행 계획 ID 또는 날짜 형식이 올바르지 않습니다.' using errcode = '22023';
  end;

  plan_title := nullif(trim(p_plan ->> 'title'), '');
  destination_name_value := nullif(trim(p_plan #>> '{destination,name}'), '');
  status_value := coalesce(nullif(p_plan ->> 'status', ''), 'draft');

  if plan_id is null or plan_title is null or destination_name_value is null
    or travel_date_value is null then
    raise exception '여행 계획의 필수 정보가 누락되었습니다.' using errcode = '22023';
  end if;

  if status_value not in ('draft', 'complete') then
    raise exception '여행 계획 상태가 올바르지 않습니다.' using errcode = '22023';
  end if;

  insert into public.mvp_travel_plans as stored_plan (
    id,
    owner_id,
    title,
    destination_name,
    travel_date,
    return_date,
    status,
    plan_data
  )
  values (
    plan_id,
    p_owner_id,
    plan_title,
    destination_name_value,
    travel_date_value,
    return_date_value,
    status_value,
    p_plan
  )
  on conflict on constraint mvp_travel_plans_pkey do update
    set title = excluded.title,
        destination_name = excluded.destination_name,
        travel_date = excluded.travel_date,
        return_date = excluded.return_date,
        status = excluded.status,
        plan_data = excluded.plan_data,
        updated_at = now()
    where stored_plan.owner_id = excluded.owner_id
  returning stored_plan.* into saved_plan;

  if not found then
    raise exception '다른 사용자의 여행 계획은 덮어쓸 수 없습니다.' using errcode = 'P0001';
  end if;

  return query
    select saved_plan.id, saved_plan.owner_id, saved_plan.plan_data,
      saved_plan.created_at, saved_plan.updated_at;
end;
$$;

create or replace function public.get_mvp_travel_plan(
  p_owner_id uuid,
  p_plan_id uuid
)
returns table (plan_data jsonb)
language sql
security definer
set search_path = public, extensions
as $$
  select stored_plan.plan_data
    from public.mvp_travel_plans as stored_plan
   where stored_plan.owner_id = p_owner_id
     and stored_plan.id = p_plan_id
   limit 1;
$$;

create or replace function public.delete_mvp_travel_plan(
  p_owner_id uuid,
  p_plan_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  deleted_count integer;
begin
  delete from public.mvp_travel_plans as stored_plan
   where stored_plan.owner_id = p_owner_id
     and stored_plan.id = p_plan_id;

  get diagnostics deleted_count = row_count;
  return deleted_count > 0;
end;
$$;

revoke all on function public.save_mvp_travel_plan(uuid, jsonb) from public;
revoke all on function public.get_mvp_travel_plan(uuid, uuid) from public;
revoke all on function public.delete_mvp_travel_plan(uuid, uuid) from public;

grant execute on function public.save_mvp_travel_plan(uuid, jsonb) to anon, authenticated, service_role;
grant execute on function public.get_mvp_travel_plan(uuid, uuid) to anon, authenticated, service_role;
grant execute on function public.delete_mvp_travel_plan(uuid, uuid) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
