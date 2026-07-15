import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';

// 로그인 전에는 로그인 페이지로 보냄 (첫 실행 시 로그인 먼저 노출)
export function RequireLogin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">로그인 상태를 확인하는 중...</div>;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}
