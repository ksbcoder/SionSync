import { useState, useEffect } from 'react';
import { usuarioRepository } from '../infrastructure/usuario.repository';
import { useAuth } from './useAuth';
import type { RoleName } from '../domain';

export function useRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<RoleName[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    let cancelado = false;
    usuarioRepository.getRolesByUser(user.id).then(names => {
      if (!cancelado) setRoles(names);
    }).catch(() => {
      // No vaciar los roles previos: una falla de red transitoria
      // dejaría al usuario sin permisos hasta recargar.
    }).finally(() => {
      if (!cancelado) setLoading(false);
    });

    return () => { cancelado = true; };
  }, [user]);

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
