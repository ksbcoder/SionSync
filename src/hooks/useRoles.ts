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
      .select('roles(name)')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const names = (data ?? [])
          .map((ur: any) => ur.roles?.name as RoleName)
          .filter(Boolean);
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
