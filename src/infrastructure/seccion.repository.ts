import { supabase } from './supabase';
import type { Seccion, SeccionInsert } from '../domain';

export const seccionRepository = {
  async create(data: SeccionInsert): Promise<Seccion> {
    const { data: created, error } = await supabase
      .from('secciones')
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return created;
  },

  async createMany(data: SeccionInsert[]): Promise<void> {
    if (data.length === 0) return;
    const { error } = await supabase.from('secciones').insert(data);
    if (error) throw new Error(error.message);
  },

  async update(id: string, data: Partial<Pick<SeccionInsert, 'tipo' | 'letra'>>): Promise<Seccion> {
    const { data: updated, error } = await supabase
      .from('secciones')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('secciones').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async updateOrden(ordenes: { id: string; orden: number }[]): Promise<void> {
    // Toda la numeración en una sola llamada atómica (función en la base):
    // o se aplican todos los cambios o ninguno, nunca queda a medias.
    const { error } = await supabase.rpc('reordenar_secciones', { ordenes });
    if (error) throw new Error(error.message);
  },
};
