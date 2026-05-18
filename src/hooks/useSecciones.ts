import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Seccion, SeccionInsert } from '../types';


export function useSecciones() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSeccion = useCallback(async (data: SeccionInsert): Promise<Seccion | null> => {
    setLoading(true);
    setError(null);
    const { data: created, error } = await supabase
      .from('secciones')
      .insert(data)
      .select()
      .single();
    setLoading(false);
    if (error) { setError(error.message); return null; }
    return created;
  }, []);

  const updateSeccion = useCallback(async (id: string, data: Partial<Pick<SeccionInsert, 'tipo' | 'letra'>>): Promise<Seccion | null> => {
    setLoading(true);
    setError(null);
    const { data: updated, error } = await supabase
      .from('secciones')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    setLoading(false);
    if (error) { setError(error.message); return null; }
    return updated;
  }, []);

  const deleteSeccion = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.from('secciones').delete().eq('id', id);
    setLoading(false);
    if (error) { setError(error.message); return false; }
    return true;
  }, []);

  const reordenarSecciones = useCallback(async (secciones: { id: string; orden: number }[]): Promise<boolean> => {
    setLoading(true);
    setError(null);
    const updates = secciones.map(({ id, orden }) =>
      supabase.from('secciones').update({ orden }).eq('id', id)
    );
    const results = await Promise.all(updates);
    setLoading(false);
    const hasError = results.some(r => r.error);
    if (hasError) { setError('Error al reordenar secciones'); return false; }
    return true;
  }, []);

  const duplicarSeccion = useCallback(async (seccion: Seccion, ordenSiguiente: number): Promise<Seccion | null> => {
    const nueva = await addSeccion({
      cancion_id: seccion.cancion_id,
      tipo: seccion.tipo,
      letra: seccion.letra,
      orden: ordenSiguiente,
    });
    if (!nueva || !seccion.notas?.length) return nueva;
    await supabase.from('notas').insert(
      seccion.notas.map(n => ({ seccion_id: nueva.id, orden: n.orden, contenido: n.contenido }))
    );
    return nueva;
  }, [addSeccion]);

  return { loading, error, addSeccion, updateSeccion, deleteSeccion, reordenarSecciones, duplicarSeccion };
}
