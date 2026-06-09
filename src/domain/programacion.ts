export interface TipoProgramacion {
  id: string;
  nombre: string;
  created_at: string;
}

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
