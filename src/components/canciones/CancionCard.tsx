import { useNavigate } from 'react-router-dom';
import { Pencil, Presentation, Trash2 } from 'lucide-react';
import { SwipeableCard } from '../ui/SwipeableCard';
import { useCanEdit } from '../../hooks/useRoles';
import type { Cancion } from '../../domain';

interface CancionCardProps {
  cancion: Cancion;
  onDelete: (id: string) => void;
}

export function CancionCard({ cancion, onDelete }: CancionCardProps) {
  const navigate = useNavigate();
  const canEdit = useCanEdit(cancion.user_id);

  const actions = [
    ...(canEdit ? [{
      icon: <Pencil className="w-5 h-5 text-white" />,
      bg: 'bg-indigo-500',
      onClick: () => navigate(`/cancion/${cancion.id}/editar`),
    }] : []),
    {
      icon: <Presentation className="w-5 h-5 text-white" />,
      bg: 'bg-violet-500',
      onClick: () => navigate(`/cancion/${cancion.id}/presentacion`),
    },
    ...(canEdit ? [{
      icon: <Trash2 className="w-5 h-5 text-white" />,
      bg: 'bg-red-500',
      onClick: () => onDelete(cancion.id),
    }] : []),
  ];

  return (
    <SwipeableCard actions={actions}>
      <div
        className="bg-white p-4 cursor-pointer active:bg-indigo-50 overflow-hidden flex items-center justify-between gap-2"
        onClick={() => navigate(`/cancion/${cancion.id}`)}
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-gray-900 leading-tight break-words">{cancion.titulo}</h3>
          {cancion.autor ? (
            <p className="mt-1 text-sm text-gray-500 break-words">{cancion.autor}</p>
          ) : (
            cancion.descripcion && <p className="mt-1 text-sm text-gray-500 italic break-words line-clamp-2">{cancion.descripcion}</p>
          )}
        </div>
        {(cancion.tonalidad || cancion.tempo) && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-px h-8 bg-gray-200 self-center" aria-hidden="true" />
            <div className="flex flex-col items-center justify-center gap-1 text-gray-500">
              {cancion.tonalidad && (
                <span className="bg-brand-100 text-brand-900 px-2 py-0.5 rounded-full text-xs font-medium">
                  {cancion.tonalidad}
                </span>
              )}
              {cancion.tempo && <span className="text-xs">{cancion.tempo} BPM</span>}
            </div>
          </div>
        )}
      </div>
    </SwipeableCard>
  );
}
