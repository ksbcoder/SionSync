import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Nota, NotaInsert } from '../types';

export function useNotas() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNotas = useCallback(async (seccion_id: string): Promise<Nota[]> => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('notas')
      .select('*')
      .eq('seccion_id', seccion_id)
      .order('orden', { ascending: true });
    setLoading(false);
    if (error) { setError(error.message); return []; }
    return data ?? [];
  }, []);

  const addNota = useCallback(async (data: NotaInsert): Promise<Nota | null> => {
    setLoading(true);
    setError(null);
    const { data: created, error } = await supabase
      .from('notas')
      .insert(data)
      .select()
      .single();
    setLoading(false);
    if (error) { setError(error.message); return null; }
    return created;
  }, []);

  const updateNota = useCallback(async (id: string, contenido: string): Promise<Nota | null> => {
    setLoading(true);
    setError(null);
    const { data: updated, error } = await supabase
      .from('notas')
      .update({ contenido })
      .eq('id', id)
      .select()
      .single();
    setLoading(false);
    if (error) { setError(error.message); return null; }
    return updated;
  }, []);

  const deleteNota = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.from('notas').delete().eq('id', id);
    setLoading(false);
    if (error) { setError(error.message); return false; }
    return true;
  }, []);

  return { loading, error, getNotas, addNota, updateNota, deleteNota };
}
