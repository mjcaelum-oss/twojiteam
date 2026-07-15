import { readLocal, removeLocal, writeLocal } from '../storage/localStorage.service';
import { supabase } from './supabase.client';

const SESSION_KEY = 'mvp-user';

export interface MvpUser {
  id: string;
  email: string;
  displayName: string;
  phone: string | null;
  createdAt: string;
}

interface MvpUserRow {
  id: string;
  email: string;
  display_name: string;
  phone: string | null;
  created_at: string;
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase 환경변수가 설정되지 않았습니다. .env.local을 확인하세요.');
  return supabase;
}

function toUser(row: MvpUserRow | null | undefined): MvpUser {
  if (!row?.id || !row.email || !row.display_name) {
    throw new Error('사용자 정보를 불러오지 못했습니다.');
  }

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    phone: row.phone,
    createdAt: row.created_at,
  };
}

function saveSession(user: MvpUser): MvpUser {
  writeLocal(SESSION_KEY, user);
  return user;
}

export async function signUp(email: string, password: string, metadata: { display_name: string; phone?: string }): Promise<MvpUser> {
  const client = requireSupabase();
  const { data, error } = await client.rpc('register_mvp_user', {
    p_email: email.trim().toLowerCase(),
    p_password: password,
    p_display_name: metadata.display_name.trim(),
    p_phone: metadata.phone?.trim() || null,
  });

  if (error) throw new Error(error.message);
  return saveSession(toUser(Array.isArray(data) ? data[0] as MvpUserRow | undefined : data as MvpUserRow | null));
}

export async function signIn(email: string, password: string): Promise<MvpUser> {
  const client = requireSupabase();
  const { data, error } = await client.rpc('login_mvp_user', {
    p_email: email.trim().toLowerCase(),
    p_password: password,
  });

  if (error) throw new Error(error.message);
  return saveSession(toUser(Array.isArray(data) ? data[0] as MvpUserRow | undefined : data as MvpUserRow | null));
}

export async function signOut(): Promise<void> {
  removeLocal(SESSION_KEY);
}

export function getSession(): { user: MvpUser | null } {
  const user = readLocal<MvpUser | null>(SESSION_KEY, null);
  if (!user?.id || !user.email || !user.displayName) {
    removeLocal(SESSION_KEY);
    return { user: null };
  }
  return { user };
}
