import { useNavigate } from 'react-router-dom';
import { SwipeableCard } from '../ui/SwipeableCard';
import type { Cancion } from '../../types';

interface CancionCardProps {
  cancion: Cancion;
  onDelete: (id: string) => void;
}

export function CancionCard({ cancion, onDelete }: CancionCardProps) {
  const navigate = useNavigate();

  return (
    <SwipeableCard onDelete={() => onDelete(cancion.id)}>
      <div
        className="bg-white p-4 cursor-pointer active:bg-indigo-50"
        onClick={() => navigate(`/cancion/${cancion.id}`)}
      >
        <h3 className="font-semibold text-lg text-gray-900 leading-tight">{cancion.titulo}</h3>
        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 flex-wrap">
          {cancion.autor && <span>{cancion.autor}</span>}
          {cancion.tonalidad && (
            <span className="bg-brand-100 text-brand-900 px-2 py-0.5 rounded-full text-xs font-medium">
              {cancion.tonalidad}
            </span>
          )}
          {cancion.tempo && <span>{cancion.tempo} BPM</span>}
        </div>
      </div>
    </SwipeableCard>
  );
}
