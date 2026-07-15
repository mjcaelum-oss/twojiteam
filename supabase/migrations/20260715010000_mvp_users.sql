-- 해커톤 MVP용 사용자 저장소입니다.
-- 이메일/전화번호 확인, Supabase Auth 사용자 생성, 인증 메일 발송을 사용하지 않습니다.
-- 브라우저에서 비밀번호 해시를 직접 읽을 수 없도록 테이블은 RLS로 닫고,
-- 회원가입/로그인 함수만 anon 역할에 공개합니다.

create extension if not exists "pgcrypto";

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create table if not exists public.mvp_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  display_name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists mvp_users_email_unique
  on public.mvp_users (lower(email));

alter table public.mvp_users enable row level security;
revoke all on table public.mvp_users from anon, authenticated;

create or replace function public.register_mvp_user(
  p_email text,
  p_password text,
  p_display_name text,
  p_phone text default null
)
returns table (
  id uuid,
  email text,
  display_name text,
  phone text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  created_user public.mvp_users%rowtype;
begin
  if nullif(trim(p_email), '') is null then
    raise exception '이메일을 입력해주세요.' using errcode = '22023';
  end if;
  if p_password is null or length(p_password) < 8 then
    raise exception '비밀번호는 8자 이상이어야 합니다.' using errcode = '22023';
  end if;
  if nullif(trim(p_display_name), '') is null then
    raise exception '닉네임을 입력해주세요.' using errcode = '22023';
  end if;

  insert into public.mvp_users (email, password_hash, display_name, phone)
  values (
    lower(trim(p_email)),
    crypt(p_password, gen_salt('bf')),
    trim(p_display_name),
    nullif(trim(p_phone), '')
  )
  returning * into created_user;

  return query
    select created_user.id, created_user.email, created_user.display_name,
      created_user.phone, created_user.created_at;
exception
  when unique_violation then
    raise exception '이미 가입된 이메일입니다.' using errcode = 'P0001';
end;
$$;

create or replace function public.login_mvp_user(
  p_email text,
  p_password text
)
returns table (
  id uuid,
  email text,
  display_name text,
  phone text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  matched_user public.mvp_users%rowtype;
begin
  select user_row.*
    into matched_user
    from public.mvp_users as user_row
   where lower(user_row.email) = lower(trim(p_email))
     and user_row.password_hash = crypt(p_password, user_row.password_hash)
   limit 1;

  if not found then
    raise exception '이메일 또는 비밀번호가 일치하지 않습니다.' using errcode = 'P0001';
  end if;

  return query
    select matched_user.id, matched_user.email, matched_user.display_name,
      matched_user.phone, matched_user.created_at;
end;
$$;

revoke all on function public.register_mvp_user(text, text, text, text) from public;
revoke all on function public.login_mvp_user(text, text) from public;
grant execute on function public.register_mvp_user(text, text, text, text) to anon, authenticated;
grant execute on function public.login_mvp_user(text, text) to anon, authenticated;
