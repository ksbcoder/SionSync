import type { Nota } from '../../domain';

interface NotasDisplayProps {
  notas: Nota[];
  presentacion?: boolean;
}

function parseAcordes(contenido: string): string[] {
  return contenido
    .split(/\s*[—–\-,]\s*/)
    .map(s => s.trim())
    .filter(Boolean);
}

export function NotasDisplay({ notas, presentacion = false }: NotasDisplayProps) {
  if (!notas.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {notas.map(nota => {
        const acordes = parseAcordes(nota.contenido);
        if (acordes.length <= 1) {
          return (
            <span
              key={nota.id}
              className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-sm font-medium ${
                presentacion
                  ? 'bg-white/10 text-chord-light'
                  : 'bg-chord-bg/50 text-chord-dark'
              }`}
            >
              {nota.contenido}
            </span>
          );
        }
        return acordes.map((acorde, i) => (
          <span
            key={`${nota.id}-${i}`}
            className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-sm font-medium ${
              presentacion
                ? 'bg-white/10 text-chord-light'
                : 'bg-chord-bg/50 text-chord-dark'
            }`}
          >
            {acorde}
          </span>
        ));
      })}
    </div>
  );
}
