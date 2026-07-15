import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { MyPage } from './MyPage';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}));
vi.mock('../../app/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { displayName: 'Merge Tester', email: 'merge@example.com', phone: '010-0000-0000' },
    signOut: vi.fn(),
  }),
}));
vi.mock('../../components/layout/Header/Header', () => ({ Header: () => null }));
vi.mock('../../components/common/Toast/Toast', () => ({ Toast: () => null }));
vi.mock('../../hooks/useLocalStorage', () => ({ useLocalStorage: () => [[], vi.fn()] }));
vi.mock('../../hooks/useToast', () => ({ useToast: () => ({ message: '', showToast: vi.fn() }) }));

describe('MyPage merge regression', () => {
  it('renders the user supplied by the auth context', () => {
    const html = renderToStaticMarkup(<MyPage />);

    expect(html).toContain('Merge Tester');
    expect(html).toContain('merge@example.com');
  });
});
