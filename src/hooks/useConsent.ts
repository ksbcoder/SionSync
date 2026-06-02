import { useState, useEffect } from 'react';
import { usuarioRepository } from '../infrastructure/usuario.repository';
import { useAuth } from './useAuth';

const CURRENT_POLICY_VERSION = '1.0';

export function useConsent() {
  const { user } = useAuth();
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHasConsent(null);
      setLoading(false);
      return;
    }

    usuarioRepository.getProfile(user.id).then(profile => {
      setHasConsent(!!profile.data_consent_at && profile.data_consent_version === CURRENT_POLICY_VERSION);
      setLoading(false);
    });
  }, [user]);

  const acceptConsent = async () => {
    if (!user) return;
    await usuarioRepository.updateConsent(user.id, CURRENT_POLICY_VERSION);
    setHasConsent(true);
  };

  return { hasConsent, loading, acceptConsent, policyVersion: CURRENT_POLICY_VERSION };
}
