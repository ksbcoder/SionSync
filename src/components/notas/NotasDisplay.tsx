import type { Nota } from '../../types';

interface NotasDisplayProps {
  notas: Nota[];
  presentacion?: boolean;
}

export function NotasDisplay({ notas, presentacion = false }: NotasDisplayProps) {
  if (!notas.length) return null;
  return (
    <div className="flex flex-col gap-1 mb-2">
      {notas.map(nota => (
        <span
          key={nota.id}
          className={`font-mono text-sm px-2 py-0.5 rounded ${
            presentacion
              ? 'text-chord-light'
              : 'text-chord-dark bg-chord-bg'
          }`}
        >
          {nota.contenido}
        </span>
      ))}
    </div>
  );
}
