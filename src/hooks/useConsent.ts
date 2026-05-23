import { useState, useEffect } from 'react';
import { supabase } from '../infrastructure/supabase';
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

    supabase
      .from('profiles')
      .select('data_consent_at, data_consent_version')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setHasConsent(!!data?.data_consent_at && data?.data_consent_version === CURRENT_POLICY_VERSION);
        setLoading(false);
      });
  }, [user]);

  const acceptConsent = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        data_consent_at: new Date().toISOString(),
        data_consent_version: CURRENT_POLICY_VERSION,
      })
      .eq('id', user.id);
    if (error) throw error;
    setHasConsent(true);
  };

  return { hasConsent, loading, acceptConsent, policyVersion: CURRENT_POLICY_VERSION };
}
