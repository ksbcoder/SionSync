import { useState, useCallback } from 'react';

export function useAsync() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const runVoid = useCallback(async (fn: () => Promise<void>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await fn();
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, run, runVoid };
}
