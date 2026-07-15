import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

// 라우트가 바뀔 때마다 화면 최상단으로 스크롤 (홈으로/페이지 이동 시 첫 화면이 위에서부터 보이도록)
export function RootLayout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return <Outlet />;
}
