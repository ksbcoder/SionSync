import type { TipoSeccion } from '../types';

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

export const TONALIDADES = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F',
  'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm',
  'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bbm', 'Bm',
];
