export type TipoSeccion = 'verso' | 'coro' | 'pre-coro' | 'puente' | 'intro' | 'outro' | 'final' | 'otro';

export interface Seccion {
  id: string;
  cancion_id: string;
  tipo: TipoSeccion;
  orden: number;
  /** Letra en formato ChordPro: los acordes van incrustados entre corchetes. */
  letra: string;
  descripcion: string | null;
  /** Secciones con el mismo valor se cantan al mismo tiempo. NULL = no simultánea. */
  grupo_simultaneo: string | null;
  created_at: string;
}

export interface SeccionInsert {
  cancion_id: string;
  tipo: TipoSeccion;
  orden: number;
  letra: string;
  descripcion?: string | null;
  grupo_simultaneo?: string | null;
}

// Una sección tal como la propone la IA, antes de guardarla (sin id ni canción).
export interface SeccionGenerada {
  tipo: TipoSeccion;
  letra: string;
}

export const TIPOS_SECCION: Record<TipoSeccion, { label: string; bg: string; text: string }> = {
  verso:      { label: 'Verso',    bg: '#c7d2fe', text: '#312e81' },
  coro:       { label: 'Coro',     bg: '#fde68a', text: '#78350f' },
  'pre-coro': { label: 'Pre-Coro', bg: '#fbcfe8', text: '#831843' },
  puente:     { label: 'Puente',   bg: '#d9f99d', text: '#3f6212' },
  intro:      { label: 'Intro',    bg: '#a7f3d0', text: '#065f46' },
  outro:      { label: 'Outro',    bg: '#fed7aa', text: '#7c2d12' },
  final:      { label: 'Final',    bg: '#e9d5ff', text: '#4c1d95' },
  otro:       { label: 'Otro',     bg: '#f1f5f9', text: '#475569' },
};

export function calcularSiguienteOrden(secciones: { orden: number }[]): number {
  if (secciones.length === 0) return 0;
  return Math.max(...secciones.map(s => s.orden)) + 1;
}
