import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { isLoggedIn } from './session';

// 로그인 전에는 로그인 페이지로 보냄 (첫 실행 시 로그인 먼저 노출)
export function RequireLogin({ children }: { children: ReactNode }) {
  return isLoggedIn() ? <>{children}</> : <Navigate to="/login" replace />;
}
