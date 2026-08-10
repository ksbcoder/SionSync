import { supabase } from './supabase';
import { getUserId } from './auth';
import type { Cancion, CancionInsert } from '../domain';

export const cancionRepository = {
  async getAll(): Promise<Cancion[]> {
    const { data, error } = await supabase
      .from('canciones')
      .select('*');
    if (error) throw new Error(error.message);
    return (data ?? []).sort((a, b) => a.titulo.localeCompare(b.titulo));
  },

  async getById(id: string): Promise<Cancion> {
    const { data, error } = await supabase
      .from('canciones')
      .select(`*, secciones(*)`)
      .eq('id', id)
      .order('orden', { referencedTable: 'secciones', ascending: true })
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async create(data: CancionInsert): Promise<Cancion> {
    const user_id = await getUserId();
    const { data: created, error } = await supabase
      .from('canciones')
      .insert({ ...data, user_id })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return created;
  },

  async update(id: string, data: Partial<CancionInsert>): Promise<Cancion> {
    const { data: updated, error } = await supabase
      .from('canciones')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('canciones').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
