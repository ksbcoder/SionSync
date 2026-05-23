import type { Nota } from '../../domain';

interface NotasDisplayProps {
  notas: Nota[];
  presentacion?: boolean;
}

export function NotasDisplay({ notas, presentacion = false }: NotasDisplayProps) {
  if (!notas.length) return null;
  return (
    <div className="flex flex-col gap-2 mb-2">
      {notas.map(nota => (
        <span
          key={nota.id}
          className={`font-mono text-sm ${
            presentacion
              ? 'text-chord-light'
              : 'text-chord-dark border-l-2 border-chord-light pl-2'
          }`}
        >
          {nota.contenido}
        </span>
      ))}
    </div>
  );
}
