import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Music2 } from 'lucide-react';
import { SwipeableCard } from '../ui/SwipeableCard';
import { useCanEdit } from '../../hooks/useRoles';
import { formatFecha } from '../../domain';
import type { Sesion } from '../../domain';

interface Props {
  sesion: Sesion;
  onEdit: (sesion: Sesion) => void;
  onDelete: (id: string) => void;
}

export function SesionCard({ sesion, onEdit, onDelete }: Props) {
  const navigate = useNavigate();
  const canEdit = useCanEdit(sesion.user_id);
  const cantidad = sesion.sesion_canciones?.[0]?.count ?? 0;

  const actions = canEdit
    ? [
        {
          icon: <Pencil className="w-5 h-5 text-white" />,
          bg: 'bg-indigo-500',
          onClick: () => onEdit(sesion),
        },
        {
          icon: <Trash2 className="w-5 h-5 text-white" />,
          bg: 'bg-red-500',
          onClick: () => onDelete(sesion.id),
        },
      ]
    : [];

  return (
    <SwipeableCard actions={actions}>
      <div
        className="bg-white p-4 cursor-pointer active:bg-indigo-50"
        onClick={() => navigate(`/sesion/${sesion.id}`)}
      >
        <h3 className="font-semibold text-lg text-gray-900 leading-tight">{sesion.nombre}</h3>
        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 flex-wrap">
          {sesion.fecha && <span className="capitalize">{formatFecha(sesion.fecha)}</span>}
          <span className="flex items-center gap-1">
            <Music2 className="w-3.5 h-3.5" />
            {cantidad} {cantidad === 1 ? 'canción' : 'canciones'}
          </span>
        </div>
      </div>
    </SwipeableCard>
  );
}
