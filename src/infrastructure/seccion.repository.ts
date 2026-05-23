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
    const updates = ordenes.map(({ id, orden }) =>
      supabase.from('secciones').update({ orden }).eq('id', id)
    );
    const results = await Promise.all(updates);
    const failed = results.find(r => r.error);
    if (failed?.error) throw new Error(failed.error.message);
  },
};
