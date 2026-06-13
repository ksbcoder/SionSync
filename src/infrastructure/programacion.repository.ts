import { supabase } from './supabase';
import { getUserId } from './auth';
import type { TipoProgramacion, Programacion, ProgramacionInsert, ResponsableProgramacion, ResponsableInsert } from '../domain';

// Trae el responsable junto con su perfil (nombre) y el de quien asignó, en
// UNA sola consulta. Los '!user_id' / '!asignado_por' le dicen a la base por
// cuál relación traer cada perfil (ambas columnas apuntan a profiles).
const SELECT_CON_PERFILES =
  '*, profiles:profiles!user_id(id, display_name), asignante:profiles!asignado_por(id, display_name)';

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
      .select(SELECT_CON_PERFILES)
      .eq('programacion_id', programacionId)
      .eq('fecha', fecha)
      .order('created_at');
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as ResponsableProgramacion[];
  },

  async getByFecha(fecha: string): Promise<ResponsableProgramacion[]> {
    const { data, error } = await supabase
      .from('responsables_programacion')
      .select(SELECT_CON_PERFILES)
      .eq('fecha', fecha)
      .order('created_at');
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as ResponsableProgramacion[];
  },

  async getByRango(desde: string, hasta: string): Promise<ResponsableProgramacion[]> {
    const { data, error } = await supabase
      .from('responsables_programacion')
      .select(SELECT_CON_PERFILES)
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha')
      .order('created_at');
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as ResponsableProgramacion[];
  },

  async asignar(data: ResponsableInsert): Promise<ResponsableProgramacion> {
    const { data: created, error } = await supabase
      .from('responsables_programacion')
      .insert(data)
      .select(SELECT_CON_PERFILES)
      .single();
    if (error) {
      if (error.code === '23505') throw new Error('Ese responsable ya está asignado para esta fecha.');
      throw new Error(error.message);
    }
    return created as unknown as ResponsableProgramacion;
  },

  async asignarVarios(data: ResponsableInsert[]): Promise<ResponsableProgramacion[]> {
    const { data: created, error } = await supabase
      .from('responsables_programacion')
      .insert(data)
      .select(SELECT_CON_PERFILES);
    if (error) {
      if (error.code === '23505') throw new Error('Uno o más responsables ya están asignados para esta fecha.');
      throw new Error(error.message);
    }
    return (created ?? []) as unknown as ResponsableProgramacion[];
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
