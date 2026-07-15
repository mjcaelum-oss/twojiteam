import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getSession, signIn, signOut, signUp } from '../../services/supabase/auth.service';
import type { MvpUser } from '../../services/supabase/auth.service';

interface AuthContextValue {
  user: MvpUser | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata: { display_name: string; phone?: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MvpUser | null>(() => getSession().user);
  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading: false,
    signUp: async (email, password, metadata) => { setUser(await signUp(email, password, metadata)); },
    signIn: async (email, password) => { setUser(await signIn(email, password)); },
    signOut: async () => { await signOut(); setUser(null); },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider가 필요합니다.');
  return value;
}
