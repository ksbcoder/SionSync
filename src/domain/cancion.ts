import type { Seccion } from './seccion';

export interface Cancion {
  id: string;
  titulo: string;
  autor: string | null;
  tonalidad: string | null;
  tempo: number | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  secciones?: Seccion[];
}

export interface CancionInsert {
  titulo: string;
  autor?: string | null;
  tonalidad?: string | null;
  tempo?: number | null;
}

export const TONALIDADES = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F',
  'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm',
  'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bbm', 'Bm',
];
