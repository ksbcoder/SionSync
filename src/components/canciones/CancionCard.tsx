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
        className="bg-white p-4 cursor-pointer active:bg-indigo-50"
        onClick={() => navigate(`/cancion/${cancion.id}`)}
      >
        <h3 className="font-semibold text-lg text-gray-900 leading-tight">{cancion.titulo}</h3>
        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 flex-wrap">
          {cancion.autor && <span>{cancion.autor}</span>}
          {cancion.autor && (cancion.tonalidad || cancion.tempo) && (
            <span className="w-px h-4 bg-gray-300 self-center" aria-hidden="true" />
          )}
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
