import { useState, useEffect } from 'react';
import { supabase } from '../infrastructure/supabase';
import { useAuth } from './useAuth';

type RoleName = 'admin' | 'miembro_alabanza' | 'miembro_iglesia';

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

    supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', user.id)
      .then(async ({ data: userRoles }) => {
        if (!userRoles?.length) {
          setRoles([]);
          setLoading(false);
          return;
        }
        const roleIds = userRoles.map(ur => ur.role_id);
        const { data: rolesData } = await supabase
          .from('roles')
          .select('name')
          .in('id', roleIds);
        const names = (rolesData ?? []).map(r => r.name as RoleName);
        console.log('[useRoles]', { userRoles, rolesData, names, userId: user.id });
        setRoles(names);
        setLoading(false);
      });
  }, [user]);

  const isAdmin = roles.includes('admin');
  const isMiembroAlabanza = roles.includes('miembro_alabanza');
  const canCreateCanciones = isAdmin || isMiembroAlabanza;

  return { roles, isAdmin, isMiembroAlabanza, canCreateCanciones, loading };
}

export function useCanEdit(ownerUserId: string | undefined) {
  const { user } = useAuth();
  const { isAdmin } = useRoles();

  if (!user || !ownerUserId) return false;
  return user.id === ownerUserId || isAdmin;
}
