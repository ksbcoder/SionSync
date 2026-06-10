export interface TipoProgramacion {
  id: string;
  nombre: string;
  color: string;
  created_at: string;
}

export const COLORES_TIPO_PROGRAMACION = [
  '#6366f1', // indigo (brand)
  '#818cf8', // indigo claro
  '#8b5cf6', // violet
  '#0ea5e9', // sky
  '#06b6d4', // cyan
  '#14b8a6', // teal
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
] as const;

export interface Programacion {
  id: string;
  tipo_id: string;
  user_id: string;
  updated_by: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  tipos_programacion?: TipoProgramacion;
}

export interface ProgramacionInsert {
  tipo_id: string;
}

export interface ResponsableProgramacion {
  id: string;
  programacion_id: string;
  user_id: string;
  asignado_por: string;
  fecha: string;
  notificado: boolean;
  created_at: string;
  profiles?: { id: string; display_name: string };
  asignante?: { id: string; display_name: string };
}

export interface ResponsableInsert {
  programacion_id: string;
  user_id: string;
  fecha: string;
}
