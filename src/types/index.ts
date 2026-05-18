export type TipoSeccion = 'verso' | 'coro' | 'pre-coro' | 'puente' | 'intro' | 'outro' | 'final' | 'otro';

export interface Cancion {
  id: string;
  titulo: string;
  autor: string | null;
  tonalidad: string | null;
  tempo: number | null;
  created_at: string;
  updated_at: string;
  secciones?: Seccion[];
}

export interface Seccion {
  id: string;
  cancion_id: string;
  tipo: TipoSeccion;
  orden: number;
  letra: string;
  created_at: string;
  notas?: Nota[];
}

export interface Nota {
  id: string;
  seccion_id: string;
  orden: number;
  contenido: string;
  created_at: string;
}

export interface CancionInsert {
  titulo: string;
  autor?: string | null;
  tonalidad?: string | null;
  tempo?: number | null;
}

export interface SeccionInsert {
  cancion_id: string;
  tipo: TipoSeccion;
  orden: number;
  letra: string;
}

export interface NotaInsert {
  seccion_id: string;
  orden: number;
  contenido: string;
}
