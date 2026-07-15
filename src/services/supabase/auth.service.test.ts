import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  readLocal: vi.fn(),
  writeLocal: vi.fn(),
  removeLocal: vi.fn(),
}));

vi.mock('./supabase.client', () => ({
  supabase: { rpc: mocks.rpc },
}));

vi.mock('../storage/localStorage.service', () => ({
  readLocal: mocks.readLocal,
  writeLocal: mocks.writeLocal,
  removeLocal: mocks.removeLocal,
}));

import { getSession, signIn, signOut, signUp } from './auth.service';

const row = {
  id: 'user-id',
  email: 'traveler@example.com',
  display_name: '여행자',
  phone: '010-1234-5678',
  created_at: '2026-07-15T00:00:00.000Z',
};

const user = {
  id: row.id,
  email: row.email,
  displayName: row.display_name,
  phone: row.phone,
  createdAt: row.created_at,
};

describe('MVP user login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readLocal.mockReturnValue(null);
  });

  it('Supabase Auth 대신 회원가입 RPC로 사용자 행을 만든다', async () => {
    mocks.rpc.mockResolvedValue({ data: [row], error: null });

    await expect(signUp(' Traveler@Example.com ', 'password123', {
      display_name: ' 여행자 ',
      phone: ' 010-1234-5678 ',
    })).resolves.toEqual(user);

    expect(mocks.rpc).toHaveBeenCalledWith('register_mvp_user', {
      p_email: 'traveler@example.com',
      p_password: 'password123',
      p_display_name: '여행자',
      p_phone: '010-1234-5678',
    });
    expect(mocks.writeLocal).toHaveBeenCalledWith('mvp-user', user);
  });

  it('이메일과 비밀번호를 로그인 RPC에서 매칭하고 로컬 세션을 저장한다', async () => {
    mocks.rpc.mockResolvedValue({ data: [row], error: null });

    await expect(signIn(' Traveler@Example.com ', 'password123')).resolves.toEqual(user);

    expect(mocks.rpc).toHaveBeenCalledWith('login_mvp_user', {
      p_email: 'traveler@example.com',
      p_password: 'password123',
    });
    expect(mocks.writeLocal).toHaveBeenCalledWith('mvp-user', user);
  });

  it('로그인 RPC 오류를 사용자에게 전달하고 세션을 저장하지 않는다', async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: '이메일 또는 비밀번호가 일치하지 않습니다.' },
    });

    await expect(signIn(row.email, 'wrong-password')).rejects.toThrow('이메일 또는 비밀번호가 일치하지 않습니다.');
    expect(mocks.writeLocal).not.toHaveBeenCalled();
  });

  it('RPC가 불완전한 사용자 행을 반환하면 로그인 실패로 처리한다', async () => {
    mocks.rpc.mockResolvedValue({ data: [{ email: row.email }], error: null });

    await expect(signIn(row.email, 'password123')).rejects.toThrow('사용자 정보를 불러오지 못했습니다.');
    expect(mocks.writeLocal).not.toHaveBeenCalled();
  });

  it('저장된 MVP 사용자 정보로 화면 세션을 복원한다', () => {
    mocks.readLocal.mockReturnValue(user);

    expect(getSession()).toEqual({ user });
  });

  it('손상된 화면 세션은 제거한다', () => {
    mocks.readLocal.mockReturnValue({ email: row.email });

    expect(getSession()).toEqual({ user: null });
    expect(mocks.removeLocal).toHaveBeenCalledWith('mvp-user');
  });

  it('로그아웃하면 화면 세션만 제거한다', async () => {
    await signOut();

    expect(mocks.removeLocal).toHaveBeenCalledWith('mvp-user');
  });
});
