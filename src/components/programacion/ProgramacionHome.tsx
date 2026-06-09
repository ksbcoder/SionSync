import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2, Bell, BellOff, MoreVertical, UserPlus, Power, Info } from 'lucide-react';
import { useRoles } from '../../hooks/useRoles';
import { useProgramaciones, useResponsables } from '../../hooks/useProgramaciones';
import { usuarioRepository } from '../../infrastructure/usuario.repository';
import { DotLoader } from '../ui/DotLoader';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmSheet } from '../ui/ConfirmSheet';
import { SwipeableCard } from '../ui/SwipeableCard';
import { BottomSheet } from '../layout/BottomSheet';
import { AsignarResponsableSheet } from './AsignarResponsableSheet';
import { CrearProgramacionSheet } from './CrearProgramacionSheet';
import type { Programacion, ResponsableProgramacion } from '../../domain';

function formatFecha(fecha: string): string {
  const d = new Date(fecha + 'T12:00:00');
  return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
}

function hoy(): string {
  return new Date().toISOString().split('T')[0];
}

function sumarDias(fecha: string, dias: number): string {
  const d = new Date(fecha + 'T12:00:00');
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
}

export function ProgramacionHome() {
  const navigate = useNavigate();
  const { canGestionarProgramacion } = useRoles();
  const { getProgramaciones, deleteProgramacion, toggleActivo, loading: loadingProg } = useProgramaciones();
  const { getResponsablesFecha, eliminarResponsable, toggleNotificado, loading: loadingResp } = useResponsables();

  const [fecha, setFecha] = useState(hoy);
  const [programaciones, setProgramaciones] = useState<Programacion[]>([]);
  const [todasProgramaciones, setTodasProgramaciones] = useState<Programacion[]>([]);
  const [responsables, setResponsables] = useState<ResponsableProgramacion[]>([]);

  const [crearOpen, setCrearOpen] = useState(false);
  const [asignarPara, setAsignarPara] = useState<Programacion | null>(null);
  const [menuProg, setMenuProg] = useState<Programacion | null>(null);

  const [detallesProg, setDetallesProg] = useState<Programacion | null>(null);
  const [creadorNombre, setCreadorNombre] = useState<string | null>(null);
  const [modificadorNombre, setModificadorNombre] = useState<string | null>(null);

  const [confirmEliminarResp, setConfirmEliminarResp] = useState<string | null>(null);
  const [confirmEliminarProg, setConfirmEliminarProg] = useState<Programacion | null>(null);
  const [confirmNotificado, setConfirmNotificado] = useState<ResponsableProgramacion | null>(null);

  const cargarProgramaciones = useCallback(async () => {
    const data = await getProgramaciones();
    setTodasProgramaciones(data ?? []);
  }, [getProgramaciones]);

  const cargarResponsables = useCallback(async () => {
    const data = await getResponsablesFecha(fecha);
    setResponsables(data ?? []);
  }, [getResponsablesFecha, fecha]);

  useEffect(() => { cargarProgramaciones(); }, [cargarProgramaciones]);
  useEffect(() => { cargarResponsables(); }, [cargarResponsables]);

  const activas = todasProgramaciones.filter(p => p.activo);
  const progsConResponsables = new Set(responsables.map(r => r.programacion_id));
  const programacionesVisibles = canGestionarProgramacion
    ? activas
    : activas.filter(p => progsConResponsables.has(p.id));

  const handleEliminarResp = async () => {
    if (!confirmEliminarResp) return;
    await eliminarResponsable(confirmEliminarResp);
    setResponsables(prev => prev.filter(r => r.id !== confirmEliminarResp));
  };

  const handleEliminarProg = async () => {
    if (!confirmEliminarProg) return;
    await deleteProgramacion(confirmEliminarProg.id);
    await cargarProgramaciones();
  };

  const handleToggleNotificado = async () => {
    if (!confirmNotificado) return;
    const nuevoEstado = !confirmNotificado.notificado;
    await toggleNotificado(confirmNotificado.id, nuevoEstado);
    setResponsables(prev => prev.map(r => r.id === confirmNotificado.id ? { ...r, notificado: nuevoEstado } : r));
  };

  const handleToggleActivo = async (prog: Programacion) => {
    await toggleActivo(prog.id, !prog.activo);
    setMenuProg(null);
    await cargarProgramaciones();
  };

  const abrirDetalles = async (prog: Programacion) => {
    setDetallesProg(prog);
    setMenuProg(null);
    setCreadorNombre(null);
    setModificadorNombre(null);

    const mismoUsuario = prog.updated_by === prog.user_id;
    try {
      const creador = await usuarioRepository.getProfile(prog.user_id);
      setCreadorNombre(creador.display_name);
      if (mismoUsuario) setModificadorNombre(creador.display_name);
    } catch { setCreadorNombre(null); }

    if (!mismoUsuario) {
      try {
        const modificador = await usuarioRepository.getProfile(prog.updated_by);
        setModificadorNombre(modificador.display_name);
      } catch { setModificadorNombre(null); }
    }
  };

  const responsablesPorProg = (progId: string) =>
    responsables.filter(r => r.programacion_id === progId);

  const loading = (loadingProg && !todasProgramaciones.length) || (loadingResp && !responsables.length);

  return (
    <div className="min-h-svh bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 flex items-center gap-2 px-4 py-3 z-10">
        <button onClick={() => navigate('/')} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">Programación</h1>
      </header>

      <div className="sticky top-[57px] bg-gray-50 px-4 pt-3 pb-2 z-10">
        <div className="flex items-center justify-between max-w-lg mx-auto bg-white rounded-xl border border-gray-200 px-2 py-1">
          <button
            onClick={() => setFecha(f => sumarDias(f, -1))}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setFecha(hoy())}
            className="flex-1 text-center py-2"
          >
            <span className={`text-sm font-medium ${fecha === hoy() ? 'text-brand-700' : 'text-gray-700'}`}>
              {formatFecha(fecha)}
            </span>
            {fecha !== hoy() && (
              <span className="block text-xs text-brand-500">Volver a hoy</span>
            )}
          </button>
          <button
            onClick={() => setFecha(f => sumarDias(f, 1))}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <main className="px-4 py-3 max-w-lg mx-auto flex flex-col gap-4">
        {loading ? (
          <DotLoader text="Cargando programación..." />
        ) : programacionesVisibles.length === 0 ? (
          <EmptyState
            title={canGestionarProgramacion ? 'No hay programaciones activas' : 'Sin programación para esta fecha'}
            description={canGestionarProgramacion ? 'Crea una programación para empezar a asignar responsables' : 'No hay responsables asignados para este día'}
          />
        ) : (
          programacionesVisibles.map(prog => {
            const resps = responsablesPorProg(prog.id);
            const swipeActions = canGestionarProgramacion ? [{
              icon: <Trash2 className="w-5 h-5 text-white" />,
              bg: 'bg-red-500',
              onClick: () => setConfirmEliminarProg(prog),
            }] : [];

            return (
              <SwipeableCard key={prog.id} actions={swipeActions}>
                <div className="bg-white">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-500" />
                      <h2 className="font-semibold text-gray-800">
                        {prog.tipos_programacion?.nombre ?? 'Programación'}
                      </h2>
                    </div>
                    {canGestionarProgramacion && (
                      <button
                        onClick={() => setMenuProg(prog)}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="px-4 py-3">
                    {resps.length === 0 ? (
                      <p className="text-sm text-gray-400 py-2">Sin responsables asignados</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {resps.map(resp => (
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
                              {canGestionarProgramacion ? (
                                <>
                                  <button
                                    onClick={() => setConfirmNotificado(resp)}
                                    className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg transition-colors ${
                                      resp.notificado
                                        ? 'text-green-600 bg-green-50'
                                        : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                                    }`}
                                    title={resp.notificado ? 'Notificado' : 'Marcar como notificado'}
                                  >
                                    {resp.notificado ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                                  </button>
                                  <button
                                    onClick={() => setConfirmEliminarResp(resp.id)}
                                    className="min-h-[36px] min-w-[36px] flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Quitar responsable"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                resp.notificado && (
                                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Notificado</span>
                                )
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
          })
        )}
      </main>

      {canGestionarProgramacion && (
        <button
          onClick={() => setCrearOpen(true)}
          className="md:hidden fixed right-4 w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg flex items-center justify-center z-50 active:scale-95 transition-transform"
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          aria-label="Nueva programación"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Menú de opciones de la programación */}
      <BottomSheet
        isOpen={!!menuProg}
        onClose={() => setMenuProg(null)}
        title={menuProg?.tipos_programacion?.nombre ?? 'Programación'}
      >
        <div className="flex flex-col gap-2">
          <button
            onClick={() => { setAsignarPara(menuProg); setMenuProg(null); }}
            className="w-full text-left p-4 rounded-xl hover:bg-gray-50 border border-gray-200 transition-colors flex items-center gap-3"
          >
            <UserPlus className="w-5 h-5 text-brand-600" />
            <div>
              <p className="font-medium text-gray-800">Asignar responsable</p>
              <p className="text-xs text-gray-400 mt-0.5">Agregar personas para el {formatFecha(fecha)}</p>
            </div>
          </button>
          <button
            onClick={() => { if (menuProg) handleToggleActivo(menuProg); }}
            className="w-full text-left p-4 rounded-xl hover:bg-gray-50 border border-gray-200 transition-colors flex items-center gap-3"
          >
            <Power className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-gray-800">Desactivar programación</p>
              <p className="text-xs text-gray-400 mt-0.5">No se mostrará en la vista principal</p>
            </div>
          </button>
          <button
            onClick={() => { if (menuProg) abrirDetalles(menuProg); }}
            className="w-full text-left p-4 rounded-xl hover:bg-gray-50 border border-gray-200 transition-colors flex items-center gap-3"
          >
            <Info className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium text-gray-800">Detalles</p>
              <p className="text-xs text-gray-400 mt-0.5">Ver quién creó y modificó</p>
            </div>
          </button>
          <button
            onClick={() => { setConfirmEliminarProg(menuProg); setMenuProg(null); }}
            className="w-full text-left p-4 rounded-xl hover:bg-red-50 border border-red-200 transition-colors flex items-center gap-3"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-red-700">Eliminar programación</p>
              <p className="text-xs text-red-400 mt-0.5">Se eliminarán todos los responsables asociados</p>
            </div>
          </button>
        </div>
      </BottomSheet>

      {/* Detalles de la programación */}
      <BottomSheet
        isOpen={!!detallesProg}
        onClose={() => setDetallesProg(null)}
        title="Detalles"
      >
        <div className="flex flex-col gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Tipo</p>
            <p className="text-gray-800 font-medium">{detallesProg?.tipos_programacion?.nombre ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Creado por</p>
            <p className="text-gray-800 font-medium">{creadorNombre ?? 'Cargando...'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Fecha de creación</p>
            <p className="text-gray-800 font-medium">
              {detallesProg?.created_at ? new Date(detallesProg.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Última modificación</p>
            <p className="text-gray-800 font-medium">
              {detallesProg?.updated_at ? new Date(detallesProg.updated_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Modificado por</p>
            <p className="text-gray-800 font-medium">{modificadorNombre ?? 'Cargando...'}</p>
          </div>
        </div>
      </BottomSheet>

      <AsignarResponsableSheet
        isOpen={!!asignarPara}
        onClose={() => setAsignarPara(null)}
        programacion={asignarPara}
        fechaInicial={fecha}
        responsablesExistentes={asignarPara ? responsablesPorProg(asignarPara.id) : []}
        onAsignado={cargarResponsables}
      />

      <CrearProgramacionSheet
        isOpen={crearOpen}
        onClose={() => setCrearOpen(false)}
        programacionesExistentes={todasProgramaciones}
        onCreada={cargarProgramaciones}
      />

      {/* Confirmación: eliminar responsable */}
      <ConfirmSheet
        isOpen={!!confirmEliminarResp}
        onClose={() => setConfirmEliminarResp(null)}
        onConfirm={handleEliminarResp}
        title="¿Quitar este responsable?"
        description="Se eliminará la asignación para esta fecha."
      />

      {/* Confirmación: eliminar programación */}
      <ConfirmSheet
        isOpen={!!confirmEliminarProg}
        onClose={() => setConfirmEliminarProg(null)}
        onConfirm={handleEliminarProg}
        title={`¿Eliminar "${confirmEliminarProg?.tipos_programacion?.nombre}"?`}
        description="Se eliminarán todos los responsables asociados a esta programación. Esta acción no se puede deshacer."
      />

      {/* Confirmación: toggle notificado */}
      <ConfirmSheet
        isOpen={!!confirmNotificado}
        onClose={() => setConfirmNotificado(null)}
        onConfirm={handleToggleNotificado}
        title={confirmNotificado?.notificado ? '¿Desmarcar como notificado?' : '¿Marcar como notificado?'}
        description={
          confirmNotificado?.notificado
            ? `${confirmNotificado.profiles?.display_name ?? 'Este responsable'} se marcará como pendiente de notificación.`
            : `Se registrará que ${confirmNotificado?.profiles?.display_name ?? 'este responsable'} ya fue notificado.`
        }
        confirmLabel={confirmNotificado?.notificado ? 'Desmarcar' : 'Marcar'}
        variant={confirmNotificado?.notificado ? 'danger' : 'success'}
      />
    </div>
  );
}
