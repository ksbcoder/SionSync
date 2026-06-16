import { useState, useEffect, type ReactNode } from 'react';
import { usuarioRepository } from '../infrastructure/usuario.repository';
import { useAuth } from './useAuth';
import { RolesContext } from './useRoles';
import type { RoleName } from '../domain';

/**
 * Carga los roles del usuario actual una sola vez y los comparte con toda la
 * app vía Context. Antes cada pantalla que preguntaba por permisos hacía su
 * propia consulta; ahora hay una sola fuente.
 */
export function RolesProvider({ children }: { children: ReactNode }) {
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

  return (
    <RolesContext.Provider value={{ roles, loading }}>
      {children}
    </RolesContext.Provider>
  );
}
