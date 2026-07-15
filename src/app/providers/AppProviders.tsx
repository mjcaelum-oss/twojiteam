import type { ReactNode } from 'react';
import { TravelPlanProvider } from './TravelPlanProvider';
import { AuthProvider } from './AuthProvider';
export function AppProviders({ children }: { children: ReactNode }) { return <AuthProvider><TravelPlanProvider>{children}</TravelPlanProvider></AuthProvider>; }
