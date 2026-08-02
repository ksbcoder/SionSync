import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoginPage } from './LoginPage';
import { ConsentGate } from './ConsentGate';
import { InactiveGate } from './InactiveGate';
import { MiembroNuevoGate } from './MiembroNuevoGate';
import { NotificacionesGate } from './NotificacionesGate';
import { OrbeLoader } from '../ui/OrbeLoader';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-svh bg-app flex items-center justify-center">
        <OrbeLoader />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <InactiveGate>
      <ConsentGate>
        <MiembroNuevoGate>
          <NotificacionesGate>{children}</NotificacionesGate>
        </MiembroNuevoGate>
      </ConsentGate>
    </InactiveGate>
  );
}
