import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Cancion, CancionInsert } from '../types';

export function useCanciones() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCanciones = useCallback(async (): Promise<Cancion[]> => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('canciones')
      .select('*')
      .order('updated_at', { ascending: false });
    setLoading(false);
    if (error) { setError(error.message); return []; }
    return data ?? [];
  }, []);

  const getCancion = useCallback(async (id: string): Promise<Cancion | null> => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('canciones')
      .select(`*, secciones(*, notas(*))`)
      .eq('id', id)
      .order('orden', { referencedTable: 'secciones', ascending: true })
      .order('orden', { referencedTable: 'secciones.notas', ascending: true })
      .single();
    setLoading(false);
    if (error) { setError(error.message); return null; }
    return data;
  }, []);

  const createCancion = useCallback(async (data: CancionInsert): Promise<Cancion | null> => {
    setLoading(true);
    setError(null);
    const { data: created, error } = await supabase
      .from('canciones')
      .insert(data)
      .select()
      .single();
    setLoading(false);
    if (error) { setError(error.message); return null; }
    return created;
  }, []);

  const updateCancion = useCallback(async (id: string, data: Partial<CancionInsert>): Promise<Cancion | null> => {
    setLoading(true);
    setError(null);
    const { data: updated, error } = await supabase
      .from('canciones')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    setLoading(false);
    if (error) { setError(error.message); return null; }
    return updated;
  }, []);

  const deleteCancion = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.from('canciones').delete().eq('id', id);
    setLoading(false);
    if (error) { setError(error.message); return false; }
    return true;
  }, []);

  const buscarCanciones = useCallback(async (query: string): Promise<Cancion[]> => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('canciones')
      .select('*')
      .ilike('titulo', `%${query}%`)
      .order('updated_at', { ascending: false });
    setLoading(false);
    if (error) { setError(error.message); return []; }
    return data ?? [];
  }, []);

  return { loading, error, getCanciones, getCancion, createCancion, updateCancion, deleteCancion, buscarCanciones };
}
