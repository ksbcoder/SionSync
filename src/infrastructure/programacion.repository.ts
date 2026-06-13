import { supabase } from './supabase';
import { getUserId } from './auth';
import type { TipoProgramacion, Programacion, ProgramacionInsert, ResponsableProgramacion, ResponsableInsert } from '../domain';

// Fila cruda de responsables tal como llega de la base, sin los perfiles aún
// adjuntados (eso lo hace enriquecerConPerfiles).
type ResponsableSinPerfiles = Omit<ResponsableProgramacion, 'profiles' | 'asignante'>;

async function enriquecerConPerfiles(responsables: ResponsableSinPerfiles[]): Promise<ResponsableProgramacion[]> {
  if (responsables.length === 0) return [];

  const userIds = [...new Set(responsables.flatMap(r => [r.user_id, r.asignado_por]))];
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds);
  if (error) throw new Error(error.message);

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

  return responsables.map(r => ({
    ...r,
    profiles: profileMap.get(r.user_id) ?? undefined,
    asignante: profileMap.get(r.asignado_por) ?? undefined,
  }));
}

export const programacionRepository = {
  async getTipos(): Promise<TipoProgramacion[]> {
    const { data, error } = await supabase
      .from('tipos_programacion')
      .select('*')
      .order('nombre');
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async createTipo(nombre: string, color: string): Promise<TipoProgramacion> {
    const { data, error } = await supabase
      .from('tipos_programacion')
      .insert({ nombre, color })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async updateTipo(id: string, nombre: string, color: string): Promise<void> {
    const { error } = await supabase
      .from('tipos_programacion')
      .update({ nombre, color })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async deleteTipo(id: string): Promise<void> {
    const { error } = await supabase
      .from('tipos_programacion')
      .delete()
      .eq('id', id);
    if (error) {
      if (error.code === '23503') {
        throw new Error('No se puede eliminar: hay programaciones que usan este tipo.');
      }
      throw new Error(error.message);
    }
  },

  async getAll(): Promise<Programacion[]> {
    const { data, error } = await supabase
      .from('programaciones')
      .select('*, tipos_programacion(*)')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async getActivas(): Promise<Programacion[]> {
    const { data, error } = await supabase
      .from('programaciones')
      .select('*, tipos_programacion(*)')
      .eq('activo', true)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async create(data: ProgramacionInsert): Promise<Programacion> {
    const user_id = await getUserId();
    const { data: created, error } = await supabase
      .from('programaciones')
      .insert({ ...data, user_id })
      .select('*, tipos_programacion(*)')
      .single();
    if (error) throw new Error(error.message);
    return created;
  },

  async toggleActivo(id: string, activo: boolean): Promise<void> {
    const { error } = await supabase
      .from('programaciones')
      .update({ activo })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('programaciones')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },
};

export const responsableRepository = {
  async getByProgramacionYFecha(programacionId: string, fecha: string): Promise<ResponsableProgramacion[]> {
    const { data, error } = await supabase
      .from('responsables_programacion')
      .select('*')
      .eq('programacion_id', programacionId)
      .eq('fecha', fecha)
      .order('created_at');
    if (error) throw new Error(error.message);
    return enriquecerConPerfiles(data ?? []);
  },

  async getByFecha(fecha: string): Promise<ResponsableProgramacion[]> {
    const { data, error } = await supabase
      .from('responsables_programacion')
      .select('*')
      .eq('fecha', fecha)
      .order('created_at');
    if (error) throw new Error(error.message);
    return enriquecerConPerfiles(data ?? []);
  },

  async getByRango(desde: string, hasta: string): Promise<ResponsableProgramacion[]> {
    const { data, error } = await supabase
      .from('responsables_programacion')
      .select('*')
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha')
      .order('created_at');
    if (error) throw new Error(error.message);
    return enriquecerConPerfiles(data ?? []);
  },

  async asignar(data: ResponsableInsert): Promise<ResponsableProgramacion> {
    const { data: created, error } = await supabase
      .from('responsables_programacion')
      .insert(data)
      .select('*')
      .single();
    if (error) {
      if (error.code === '23505') throw new Error('Ese responsable ya está asignado para esta fecha.');
      throw new Error(error.message);
    }
    const [enriched] = await enriquecerConPerfiles([created]);
    return enriched;
  },

  async asignarVarios(data: ResponsableInsert[]): Promise<ResponsableProgramacion[]> {
    const { data: created, error } = await supabase
      .from('responsables_programacion')
      .insert(data)
      .select('*');
    if (error) {
      if (error.code === '23505') throw new Error('Uno o más responsables ya están asignados para esta fecha.');
      throw new Error(error.message);
    }
    return enriquecerConPerfiles(created ?? []);
  },

  async toggleNotificado(id: string, notificado: boolean): Promise<void> {
    const { error } = await supabase
      .from('responsables_programacion')
      .update({ notificado })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async eliminar(id: string): Promise<void> {
    const { error } = await supabase
      .from('responsables_programacion')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },
};
