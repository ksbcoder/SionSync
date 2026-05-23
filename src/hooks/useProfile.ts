import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { usuarioService } from '../application/usuario.service';

export function useProfile() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setDisplayName('');
      setLoading(false);
      return;
    }
    const profile = await usuarioService.getProfile(user.id);
    setDisplayName(profile?.display_name ?? '');
    setLoading(false);
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  return { displayName, loading, reload };
}
