import { useState, useCallback } from 'react';
import { useToast } from './useToast';

export function useAsync() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const runVoid = useCallback(async (fn: () => Promise<void>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await fn();
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      setError(message);
      showToast(message, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  return { loading, error, run, runVoid };
}
