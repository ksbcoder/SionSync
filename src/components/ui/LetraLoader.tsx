import { OrbePensante } from './OrbePensante';

// Una barra "esqueleto" con barrido de luz (shimmer), simula contenido cargando.
function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-brand-100/70 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-shimmer" />
    </div>
  );
}

// Cada bloque imita una sección de la letra escribiéndose: un "badge" y varias
// líneas de ancho variable, como versos. El retraso escalonado da sensación de
// que la letra va apareciendo poco a poco.
const BLOQUES = [
  ['w-full', 'w-11/12', 'w-4/5', 'w-2/3'],
  ['w-full', 'w-5/6', 'w-3/4'],
];

/**
 * Loader bonito para la generación de letra con IA. A diferencia de DotLoader,
 * se queda dentro de la hoja (no tapa toda la pantalla) y muestra el resultado
 * "formándose": un orbe de puntos que "piensa" y un esqueleto de secciones con
 * shimmer.
 */
export function LetraLoader({ text = 'La IA está buscando la letra...' }: { text?: string }) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex items-center gap-3.5 text-brand-700">
        <OrbePensante state="composing" size={64} label={text} />
        <span className="text-sm font-medium">{text}</span>
      </div>

      {BLOQUES.map((lineas, b) => (
        <div key={b} className="border border-gray-100 rounded-xl p-3 flex flex-col gap-2.5">
          <Shimmer className="h-5 w-24 rounded-md" />
          {lineas.map((ancho, l) => (
            <Shimmer key={l} className={`h-3 rounded ${ancho}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
