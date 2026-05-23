import { supabase } from './supabase';
import type { Nota, NotaInsert } from '../domain';

export const notaRepository = {
  async getBySeccion(seccionId: string): Promise<Nota[]> {
    const { data, error } = await supabase
      .from('notas')
      .select('*')
      .eq('seccion_id', seccionId)
      .order('orden', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async create(data: NotaInsert): Promise<Nota> {
    const { data: created, error } = await supabase
      .from('notas')
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return created;
  },

  async createMany(data: NotaInsert[]): Promise<void> {
    if (data.length === 0) return;
    const { error } = await supabase.from('notas').insert(data);
    if (error) throw new Error(error.message);
  },

  async update(id: string, contenido: string): Promise<Nota> {
    const { data: updated, error } = await supabase
      .from('notas')
      .update({ contenido })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('notas').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
