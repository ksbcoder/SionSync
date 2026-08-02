import { Trash2, Bell, BellOff, MoreVertical } from 'lucide-react';
import { SwipeableCard } from '../ui/SwipeableCard';
import type { Programacion, ResponsableProgramacion } from '../../domain';

/**
 * Tarjeta de una programación con la lista de sus responsables para la fecha
 * seleccionada. El menú (⋮) lo ven todos —al menos para consultar los
 * detalles—, mientras que el botón de quitar y el swipe para eliminar son solo
 * para quien puede editar; el estado "notificado" es accionable solo para quien
 * gestiona notificaciones, y de lectura para el resto.
 */
export function TarjetaProgramacion({
  prog,
  responsables,
  puedeEditar,
  canGestionarNotificaciones,
  onAbrirMenu,
  onEliminarProg,
  onEliminarResp,
  onToggleNotificado,
}: {
  prog: Programacion;
  responsables: ResponsableProgramacion[];
  puedeEditar: boolean;
  canGestionarNotificaciones: boolean;
  onAbrirMenu: (prog: Programacion) => void;
  onEliminarProg: (prog: Programacion) => void;
  onEliminarResp: (respId: string) => void;
  onToggleNotificado: (resp: ResponsableProgramacion) => void;
}) {
  const swipeActions = puedeEditar ? [{
    icon: <Trash2 className="w-5 h-5 text-white" />,
    bg: 'bg-red-500',
    onClick: () => onEliminarProg(prog),
  }] : [];

  return (
    <SwipeableCard actions={swipeActions}>
      <div className="bg-white">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: prog.tipos_programacion?.color ?? '#6366f1' }}
            />
            <h2 className="font-semibold text-gray-800">
              {prog.tipos_programacion?.nombre ?? 'Programación'}
            </h2>
          </div>
          <button
            onClick={() => onAbrirMenu(prog)}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Opciones de la programación"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3">
          {responsables.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">Sin responsables asignados</p>
          ) : (
            <div className="flex flex-col gap-2">
              {responsables.map(resp => (
                <div key={resp.id} className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {resp.profiles?.display_name ?? 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Asignado por {resp.asignante?.display_name ?? '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {canGestionarNotificaciones ? (
                      <button
                        onClick={() => onToggleNotificado(resp)}
                        className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg transition-colors ${
                          resp.notificado
                            ? 'text-success bg-chord-bg/40'
                            : 'text-warning bg-amber-50'
                        }`}
                        title={resp.notificado ? 'Notificado' : 'Marcar como notificado'}
                      >
                        {resp.notificado ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </button>
                    ) : (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          resp.notificado
                            ? 'text-success bg-chord-bg/40'
                            : 'text-warning bg-amber-50'
                        }`}
                        title={resp.notificado ? 'Notificado' : 'Pendiente de notificar'}
                      >
                        {resp.notificado ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                        {resp.notificado ? 'Notificado' : 'Pendiente'}
                      </span>
                    )}
                    {puedeEditar && (
                      <button
                        onClick={() => onEliminarResp(resp.id)}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Quitar responsable"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SwipeableCard>
  );
}
