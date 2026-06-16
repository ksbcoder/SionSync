import type { Cancion } from './cancion';

export interface Sesion {
  id: string;
  nombre: string;
  fecha: string | null;
  user_id: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  // Cantidad de canciones de la sesión (cuando se trae con el conteo).
  sesion_canciones?: { count: number }[];
}

/** Una canción dentro de una sesión, con su orden y la canción del catálogo. */
export interface SesionCancion {
  id: string;
  sesion_id: string;
  cancion_id: string;
  orden: number;
  created_at: string;
  canciones?: Cancion;
}

/** Sesión con sus canciones ya cargadas (para la pantalla de detalle). */
export interface SesionConCanciones extends Sesion {
  canciones: SesionCancion[];
}

export interface SesionInsert {
  nombre: string;
  fecha?: string | null;
}
