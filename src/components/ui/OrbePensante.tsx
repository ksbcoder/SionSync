import { useEffect, useRef } from 'react';
import { MODE_DRAWS, resolvePreset, type OrbState } from 'thinking-orbs';

// La librería `thinking-orbs` solo pinta en escala de grises y no acepta un
// color. En vez de copiar su código, usamos la API que ella misma expone para
// "dibujar en tu propio canvas" (resolvePreset + MODE_DRAWS) y recoloreamos el
// resultado: cada punto conserva su gris original como medida de profundidad y
// ese gris se traduce a un tono de nuestra paleta indigo.

// Extremos de cada rampa: el primer color es para los puntos cercanos (gris
// oscuro en el original) y el segundo para los lejanos (gris claro). Sobre
// fondo claro se usa indigo oscuro→claro; sobre un fondo indigo (botones
// brand-500) hay que invertir el planteamiento y tirar a blanco, o el orbe se
// perdería contra el fondo.
const EXTREMOS = {
  'sobre-claro': [
    [0x31, 0x2e, 0x81], // #312e81 brand-900
    [0xe0, 0xe7, 0xff] // #e0e7ff brand-100
  ],
  'sobre-indigo': [
    [0xff, 0xff, 0xff], // blanco
    [0xa5, 0xb4, 0xfc] // #a5b4fc brand-300
  ]
} as const;

export type TonoOrbe = keyof typeof EXTREMOS;

// Tablas de 256 colores calculadas una sola vez: evitan interpolar por píxel en
// cada fotograma.
const RAMPAS = (() => {
  const mapa = {} as Record<TonoOrbe, Uint8ClampedArray>;
  for (const tono of Object.keys(EXTREMOS) as TonoOrbe[]) {
    const [cerca, lejos] = EXTREMOS[tono];
    const tabla = new Uint8ClampedArray(256 * 3);
    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      tabla[i * 3] = cerca[0] + (lejos[0] - cerca[0]) * t;
      tabla[i * 3 + 1] = cerca[1] + (lejos[1] - cerca[1]) * t;
      tabla[i * 3 + 2] = cerca[2] + (lejos[2] - cerca[2]) * t;
    }
    mapa[tono] = tabla;
  }
  return mapa;
})();

/** Sustituye el gris de cada píxel visible por su equivalente en la rampa. */
function tenir(datos: ImageData, rampa: Uint8ClampedArray) {
  const px = datos.data;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue; // píxel transparente: nada que teñir
    const j = px[i] * 3; // los puntos son grises, basta con el canal rojo
    px[i] = rampa[j];
    px[i + 1] = rampa[j + 1];
    px[i + 2] = rampa[j + 2];
  }
}

interface OrbePensanteProps {
  /** Animación a mostrar; 'composing' es la de "escribiendo un texto". */
  state?: OrbState;
  /** Solo 20 o 64: son dos diseños distintos, no el mismo escalado. */
  size?: 20 | 64;
  /** Paleta según el fondo donde se monta el orbe. */
  tono?: TonoOrbe;
  label: string;
}

/**
 * Orbe de puntos animado en indigo, para indicar que la IA está trabajando.
 * Se detiene solo cuando la pestaña está oculta y respeta la preferencia del
 * sistema de "reducir movimiento" (en ese caso pinta un fotograma fijo).
 */
export function OrbePensante({
  state = 'composing',
  size = 64,
  tono = 'sobre-claro',
  label
}: OrbePensanteProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Duplicamos la resolución interna en pantallas nítidas (tope 2x).
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const ancho = Math.round(size * dpr);
    canvas.width = ancho;
    canvas.height = ancho;

    const { mode, speed, opts } = resolvePreset(state, size);
    const dibujar = MODE_DRAWS[mode];
    const rampa = RAMPAS[tono];

    const fotograma = (segundos: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      dibujar(ctx, size, segundos, false, opts); // false = tinta oscura sobre fondo claro
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const datos = ctx.getImageData(0, 0, ancho, ancho);
      tenir(datos, rampa);
      ctx.putImageData(datos, 0, 0);
    };

    const sinMovimiento =
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (sinMovimiento) {
      fotograma(0.6); // un solo fotograma representativo
      return;
    }

    let raf = 0;
    let animando = false;
    const ciclo = () => {
      fotograma((performance.now() / 1000) * speed);
      if (animando) raf = requestAnimationFrame(ciclo);
    };
    const arrancar = () => {
      if (animando) return;
      animando = true;
      raf = requestAnimationFrame(ciclo);
    };
    const detener = () => {
      animando = false;
      cancelAnimationFrame(raf);
    };

    const alCambiarVisibilidad = () => {
      if (document.visibilityState === 'hidden') detener();
      else arrancar();
    };
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    arrancar();

    return () => {
      detener();
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
    };
  }, [state, size, tono]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={label}
      style={{ width: size, height: size, display: 'block' }}
    />
  );
}
