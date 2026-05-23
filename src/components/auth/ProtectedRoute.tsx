import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoginPage } from './LoginPage';
import { ConsentGate } from './ConsentGate';
import { DotLoader } from '../ui/DotLoader';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-svh bg-app flex items-center justify-center">
        <DotLoader />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return <ConsentGate>{children}</ConsentGate>;
}
