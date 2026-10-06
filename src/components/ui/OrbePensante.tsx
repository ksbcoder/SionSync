import { ThinkingOrb, type OrbState, type ThinkingOrbProps } from 'thinking-orbs';

export type TonoOrbe = 'sobre-claro' | 'sobre-indigo';

// La librería da profundidad desvaneciendo los puntos lejanos hacia blanco
// (tema `light`) o hacia negro (tema `dark`); no sabe desvanecerlos hacia otro
// color de fondo.
// - Sobre fondo claro: tinta indigo brand-900 que se aclara hacia blanco.
// - Sobre un botón indigo (brand-500): puntos blancos que se oscurecen hacia
//   negro, y la mezcla `screen` del canvas convierte ese negro en el indigo del
//   botón. Así los puntos lejanos se funden con el fondo en vez de verse grises.
// El tema se fija a mano: en `auto` seguiría el modo oscuro del sistema, y la
// app no tiene modo oscuro.
const TONOS: Record<TonoOrbe, Pick<ThinkingOrbProps, 'theme' | 'color' | 'style'>> = {
  'sobre-claro': { theme: 'light', color: '#312e81' },
  'sobre-indigo': { theme: 'dark', style: { mixBlendMode: 'screen' } }
};

interface OrbePensanteProps {
  /** Animación a mostrar; 'breathing' es un anillo que "respira" despacio. */
  state?: OrbState;
  /** Solo 20 o 64: son dos diseños distintos, no el mismo escalado. */
  size?: 20 | 64;
  /** Paleta según el fondo donde se monta el orbe. */
  tono?: TonoOrbe;
  label: string;
}

/**
 * Orbe de puntos animado en indigo, para indicar que la IA está trabajando.
 * Se detiene solo cuando sale de la pantalla o la pestaña está oculta, y
 * respeta la preferencia del sistema de "reducir movimiento" (en ese caso pinta
 * un fotograma fijo).
 */
export function OrbePensante({
  state = 'breathing',
  size = 64,
  tono = 'sobre-claro',
  label
}: OrbePensanteProps) {
  return <ThinkingOrb state={state} size={size} aria-label={label} {...TONOS[tono]} />;
}
