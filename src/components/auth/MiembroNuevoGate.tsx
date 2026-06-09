import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRoles } from '../../hooks/useRoles';

export function MiembroNuevoGate({ children }: { children: ReactNode }) {
  const { isMiembroNuevo, loading } = useRoles();
  const location = useLocation();

  if (loading) return <>{children}</>;
  if (isMiembroNuevo && location.pathname !== '/') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
