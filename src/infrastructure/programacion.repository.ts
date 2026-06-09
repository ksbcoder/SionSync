import { supabase } from './supabase';
import type { TipoProgramacion, Programacion, ProgramacionInsert, ResponsableProgramacion, ResponsableInsert } from '../domain';

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');
  return user.id;
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
      .select('*, profiles:user_id(id, display_name), asignante:asignado_por(id, display_name)')
      .eq('programacion_id', programacionId)
      .eq('fecha', fecha)
      .order('created_at');
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async getByFecha(fecha: string): Promise<ResponsableProgramacion[]> {
    const { data, error } = await supabase
      .from('responsables_programacion')
      .select('*, profiles:user_id(id, display_name), asignante:asignado_por(id, display_name)')
      .eq('fecha', fecha)
      .order('created_at');
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async getByRango(desde: string, hasta: string): Promise<ResponsableProgramacion[]> {
    const { data, error } = await supabase
      .from('responsables_programacion')
      .select('*, profiles:user_id(id, display_name), asignante:asignado_por(id, display_name)')
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha')
      .order('created_at');
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async asignar(data: ResponsableInsert): Promise<ResponsableProgramacion> {
    const { data: created, error } = await supabase
      .from('responsables_programacion')
      .insert(data)
      .select('*, profiles:user_id(id, display_name), asignante:asignado_por(id, display_name)')
      .single();
    if (error) throw new Error(error.message);
    return created;
  },

  async asignarVarios(data: ResponsableInsert[]): Promise<ResponsableProgramacion[]> {
    const { data: created, error } = await supabase
      .from('responsables_programacion')
      .insert(data)
      .select('*, profiles:user_id(id, display_name), asignante:asignado_por(id, display_name)');
    if (error) throw new Error(error.message);
    return created ?? [];
  },

  async marcarNotificado(id: string): Promise<void> {
    const { error } = await supabase
      .from('responsables_programacion')
      .update({ notificado: true })
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
