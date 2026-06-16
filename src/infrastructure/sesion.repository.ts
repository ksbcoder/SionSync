import { supabase } from './supabase';
import { getUserId } from './auth';
import type { Sesion, SesionConCanciones, SesionCancion, SesionInsert } from '../domain';

export const sesionRepository = {
  async getAll(): Promise<Sesion[]> {
    // Traemos el conteo de canciones de cada sesión en la misma consulta.
    const { data, error } = await supabase
      .from('sesiones')
      .select('*, sesion_canciones(count)')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Sesion[];
  },

  async getById(id: string): Promise<SesionConCanciones> {
    const { data, error } = await supabase
      .from('sesiones')
      .select('*, sesion_canciones(*, canciones(*))')
      .eq('id', id)
      .order('orden', { referencedTable: 'sesion_canciones', ascending: true })
      .single();
    if (error) throw new Error(error.message);

    // La relación llega como 'sesion_canciones'; la exponemos como 'canciones'
    // (la lista ordenada de canciones de la sesión) para la pantalla de detalle.
    const { sesion_canciones, ...sesion } = data as unknown as Sesion & {
      sesion_canciones: SesionCancion[];
    };
    return { ...sesion, canciones: sesion_canciones ?? [] };
  },

  async create(data: SesionInsert): Promise<Sesion> {
    const user_id = await getUserId();
    const { data: created, error } = await supabase
      .from('sesiones')
      .insert({ ...data, user_id })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return created;
  },

  async update(id: string, data: Partial<SesionInsert>): Promise<Sesion> {
    const { data: updated, error } = await supabase
      .from('sesiones')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('sesiones').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async agregarCancion(sesionId: string, cancionId: string, orden: number): Promise<void> {
    const { error } = await supabase
      .from('sesion_canciones')
      .insert({ sesion_id: sesionId, cancion_id: cancionId, orden });
    if (error) {
      if (error.code === '23505') throw new Error('Esa canción ya está en la sesión.');
      throw new Error(error.message);
    }
  },

  async agregarVarias(
    sesionId: string,
    items: { cancionId: string; orden: number }[]
  ): Promise<void> {
    const filas = items.map(i => ({ sesion_id: sesionId, cancion_id: i.cancionId, orden: i.orden }));
    const { error } = await supabase.from('sesion_canciones').insert(filas);
    if (error) {
      if (error.code === '23505') throw new Error('Una o más canciones ya estaban en la sesión.');
      throw new Error(error.message);
    }
  },

  async quitarCancion(sesionCancionId: string): Promise<void> {
    const { error } = await supabase.from('sesion_canciones').delete().eq('id', sesionCancionId);
    if (error) throw new Error(error.message);
  },

  async reordenar(ordenes: { id: string; orden: number }[]): Promise<void> {
    const updates = ordenes.map(({ id, orden }) =>
      supabase.from('sesion_canciones').update({ orden }).eq('id', id)
    );
    const results = await Promise.all(updates);
    const failed = results.find(r => r.error);
    if (failed?.error) throw new Error(failed.error.message);
  },
};
