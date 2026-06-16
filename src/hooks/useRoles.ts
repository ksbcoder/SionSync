import { createContext, useContext } from 'react';
import { useAuth } from './useAuth';
import type { RoleName } from '../domain';

export interface RolesContextValue {
  roles: RoleName[];
  loading: boolean;
}

// Los roles se cargan una sola vez en RolesProvider y se comparten por aquí,
// así ninguna pantalla repite la consulta a la base.
export const RolesContext = createContext<RolesContextValue>({ roles: [], loading: true });

export function useRoles() {
  const { roles, loading } = useContext(RolesContext);

  const isAdmin = roles.includes('admin');
  const isGestorAlabanza = roles.includes('gestor_alabanza');
  const isMiembroAlabanza = roles.includes('miembro_alabanza');
  const isMiembroNuevo = !loading && !isAdmin && !isGestorAlabanza && !isMiembroAlabanza;
  const canCreateCanciones = isAdmin || isMiembroAlabanza || isGestorAlabanza;
  const canGestionarProgramacion = isAdmin || isGestorAlabanza;
  const canGestionarTiposProgramacion = isAdmin;
  const canGestionarNotificaciones = isAdmin;

  return {
    roles,
    isAdmin,
    isGestorAlabanza,
    isMiembroAlabanza,
    isMiembroNuevo,
    canCreateCanciones,
    canGestionarProgramacion,
    canGestionarTiposProgramacion,
    canGestionarNotificaciones,
    loading,
  };
}

export function useCanEdit(ownerUserId: string | undefined) {
  const { user } = useAuth();
  const { isAdmin, isGestorAlabanza } = useRoles();

  if (!user || !ownerUserId) return false;
  return user.id === ownerUserId || isAdmin || isGestorAlabanza;
}
