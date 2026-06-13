import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2, Bell, BellOff, MoreVertical, UserPlus, Power, Info } from 'lucide-react';
import { useRoles } from '../../hooks/useRoles';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useProgramaciones, useResponsables } from '../../hooks/useProgramaciones';
import { useRealtime } from '../../hooks/useRealtime';
import { useRecargarAlVolver } from '../../hooks/useRecargarAlVolver';
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

const LETRAS_DIA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function inicioSemana(fecha: string): string {
  const d = new Date(fecha + 'T12:00:00');
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return toISODate(d);
}

function toISODate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function hoy(): string {
  return toISODate(new Date());
}

function sumarDias(fecha: string, dias: number): string {
  const d = new Date(fecha + 'T12:00:00');
  d.setDate(d.getDate() + dias);
  return toISODate(d);
}

export function ProgramacionHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isAdmin, canGestionarProgramacion, canGestionarNotificaciones } = useRoles();
  const { getProgramaciones, deleteProgramacion, toggleActivo, loading: loadingProg } = useProgramaciones();
  const { getResponsablesRango, eliminarResponsable, toggleNotificado, loading: loadingResp } = useResponsables();

  const [fecha, setFecha] = useState(hoy);
  const [verInactivas, setVerInactivas] = useState(false);
  const [todasProgramaciones, setTodasProgramaciones] = useState<Programacion[]>([]);
  const [responsablesSemana, setResponsablesSemana] = useState<ResponsableProgramacion[]>([]);

  const diasSemana = useMemo(() => {
    const inicio = inicioSemana(fecha);
    return Array.from({ length: 7 }, (_, i) => sumarDias(inicio, i));
  }, [fecha]);

  const responsables = responsablesSemana.filter(r => r.fecha === fecha);

  const coloresPorFecha = useMemo(() => {
    const progPorId = new Map(todasProgramaciones.map(p => [p.id, p]));
    const m = new Map<string, string[]>();
    for (const r of responsablesSemana) {
      const prog = progPorId.get(r.programacion_id);
      if (!prog?.activo) continue;
      const color = prog.tipos_programacion?.color;
      if (!color) continue;
      const arr = m.get(r.fecha) ?? [];
      if (!arr.includes(color)) arr.push(color);
      m.set(r.fecha, arr);
    }
    return m;
  }, [responsablesSemana, todasProgramaciones]);

  const puedeEditarProg = (prog: Programacion) => isAdmin || (canGestionarProgramacion && prog.user_id === user?.id);

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

  const cargarSemana = useCallback(async () => {
    const data = await getResponsablesRango(diasSemana[0], diasSemana[6]);
    setResponsablesSemana(data ?? []);
  }, [getResponsablesRango, diasSemana]);

  useEffect(() => { cargarProgramaciones(); }, [cargarProgramaciones]);
  useEffect(() => { cargarSemana(); }, [cargarSemana]);

  const recargarTodo = useCallback(() => {
    cargarProgramaciones();
    cargarSemana();
  }, [cargarProgramaciones, cargarSemana]);

  // En vivo: si otro dispositivo cambia algo, esta pantalla se actualiza sola.
  useRealtime(['programaciones', 'responsables_programacion', 'tipos_programacion'], recargarTodo);
  // Red de seguridad: recargar al volver a la app tras un rato en segundo plano.
  useRecargarAlVolver(recargarTodo);

  const mostrandoInactivas = canGestionarProgramacion && verInactivas;
  const filtradas = todasProgramaciones.filter(p => p.activo === !mostrandoInactivas);
  const progsConResponsables = new Set(responsables.map(r => r.programacion_id));
  const programacionesVisibles = canGestionarProgramacion
    ? filtradas
    : filtradas.filter(p => progsConResponsables.has(p.id));

  const handleEliminarResp = async () => {
    if (!confirmEliminarResp) return;
    const ok = await eliminarResponsable(confirmEliminarResp);
    if (ok) {
      setResponsablesSemana(prev => prev.filter(r => r.id !== confirmEliminarResp));
      showToast('Responsable eliminado', 'success');
    }
  };

  const handleEliminarProg = async () => {
    if (!confirmEliminarProg) return;
    const ok = await deleteProgramacion(confirmEliminarProg.id);
    if (ok) {
      await cargarProgramaciones();
      showToast('Programación eliminada', 'success');
    }
  };

  const handleToggleNotificado = async () => {
    if (!confirmNotificado) return;
    const nuevoEstado = !confirmNotificado.notificado;
    const ok = await toggleNotificado(confirmNotificado.id, nuevoEstado);
    if (ok) {
      setResponsablesSemana(prev => prev.map(r => r.id === confirmNotificado.id ? { ...r, notificado: nuevoEstado } : r));
      showToast(nuevoEstado ? 'Marcado como notificado' : 'Marcado como pendiente', 'success');
    }
  };

  const handleToggleActivo = async (prog: Programacion) => {
    const nuevoEstado = !prog.activo;
    const ok = await toggleActivo(prog.id, nuevoEstado);
    setMenuProg(null);
    if (ok) {
      await cargarProgramaciones();
      if (nuevoEstado) setVerInactivas(false);
      showToast(nuevoEstado ? 'Programación reactivada' : 'Programación desactivada', 'success');
    }
  };

  const abrirDetalles = async (prog: Programacion) => {
    setDetallesProg(prog);
    setMenuProg(null);
    setCreadorNombre(null);
    setModificadorNombre(null);

    try {
      const ids = [...new Set([prog.user_id, prog.updated_by])];
      const perfiles = await usuarioRepository.getProfilesByIds(ids);
      const porId = new Map(perfiles.map(p => [p.id, p.display_name]));
      setCreadorNombre(porId.get(prog.user_id) ?? 'No disponible');
      setModificadorNombre(porId.get(prog.updated_by) ?? 'No disponible');
    } catch {
      setCreadorNombre('No disponible');
      setModificadorNombre('No disponible');
    }
  };

  const responsablesPorProg = (progId: string) =>
    responsables.filter(r => r.programacion_id === progId);

  const loading = (loadingProg && !todasProgramaciones.length) || (loadingResp && !responsablesSemana.length);

  return (
    <div className="min-h-svh bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 flex items-center gap-2 px-4 py-3 z-10">
        <button onClick={() => navigate('/')} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-lg font-semibold text-gray-800">Programación</h1>
        {canGestionarProgramacion && (
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => setVerInactivas(false)}
              className={`px-3 py-1.5 rounded-md transition-colors ${!verInactivas ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500'}`}
            >
              Activas
            </button>
            <button
              onClick={() => setVerInactivas(true)}
              className={`px-3 py-1.5 rounded-md transition-colors ${verInactivas ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500'}`}
            >
              Inactivas
            </button>
          </div>
        )}
      </header>

      <div className="sticky top-[57px] bg-gray-50 px-4 pt-3 pb-2 z-10">
        <div className="max-w-lg mx-auto bg-white rounded-xl border border-gray-200 px-2 py-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFecha(f => sumarDias(f, -7))}
              className="min-h-[40px] min-w-[36px] flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 grid grid-cols-7 gap-0.5">
              {diasSemana.map((dia, i) => {
                const d = new Date(dia + 'T12:00:00');
                const esSeleccionado = dia === fecha;
                const esHoy = dia === hoy();
                const colores = coloresPorFecha.get(dia) ?? [];
                return (
                  <button
                    key={dia}
                    onClick={() => setFecha(dia)}
                    className={`flex flex-col items-center py-1.5 rounded-lg transition-colors ${
                      esSeleccionado ? 'bg-stage-bg text-white' : 'hover:bg-brand-100 text-gray-700'
                    }`}
                  >
                    <span className={`text-[10px] font-medium uppercase ${esSeleccionado ? 'text-white/70' : 'text-gray-400'}`}>
                      {LETRAS_DIA[i]}
                    </span>
                    <span className={`text-sm font-semibold ${esHoy && !esSeleccionado ? 'text-brand-700' : ''}`}>
                      {d.getDate()}
                    </span>
                    <span className="flex items-center gap-0.5 mt-1 h-1.5">
                      {colores.slice(0, 3).map((c, idx) => (
                        <span
                          key={idx}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setFecha(f => sumarDias(f, 7))}
              className="min-h-[40px] min-w-[36px] flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg"
              aria-label="Semana siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          {fecha !== hoy() && (
            <button
              onClick={() => setFecha(hoy())}
              className="block w-full text-center text-xs text-brand-500 mt-1.5"
            >
              Volver a hoy
            </button>
          )}
        </div>
      </div>

      <main className="px-4 py-3 max-w-lg mx-auto flex flex-col gap-4">
        {loading ? (
          <DotLoader text="Cargando programación..." />
        ) : programacionesVisibles.length === 0 ? (
          <EmptyState
            title={
              !canGestionarProgramacion ? 'Sin programación para esta fecha'
              : mostrandoInactivas ? 'No hay programaciones inactivas'
              : 'No hay programaciones activas'
            }
            description={
              !canGestionarProgramacion ? 'No hay responsables asignados para este día'
              : mostrandoInactivas ? 'Las programaciones que desactives aparecerán aquí'
              : 'Crea una programación para empezar a asignar responsables'
            }
          />
        ) : (
          programacionesVisibles.map(prog => {
            const resps = responsablesPorProg(prog.id);
            const puedeEditar = puedeEditarProg(prog);
            const swipeActions = puedeEditar ? [{
              icon: <Trash2 className="w-5 h-5 text-white" />,
              bg: 'bg-red-500',
              onClick: () => setConfirmEliminarProg(prog),
            }] : [];

            return (
              <SwipeableCard key={prog.id} actions={swipeActions}>
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
                    {puedeEditar && (
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
                              {canGestionarNotificaciones ? (
                                <button
                                  onClick={() => setConfirmNotificado(resp)}
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
                                  onClick={() => setConfirmEliminarResp(resp.id)}
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
          })
        )}
      </main>

      {canGestionarProgramacion && !mostrandoInactivas && (
        <button
          onClick={() => setCrearOpen(true)}
          className="fixed right-4 w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg flex items-center justify-center z-50 active:scale-95 transition-transform"
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
          {menuProg?.activo && (
            <button
              onClick={() => { setAsignarPara(menuProg); setMenuProg(null); }}
              className="w-full text-left p-4 rounded-xl hover:bg-gray-50 border border-gray-200 transition-colors flex items-center gap-3"
            >
              <UserPlus className="w-5 h-5 text-brand-700" />
              <div>
                <p className="font-medium text-gray-800">Asignar responsable</p>
                <p className="text-xs text-gray-400 mt-0.5">Agregar personas para el {formatFecha(fecha)}</p>
              </div>
            </button>
          )}
          <button
            onClick={() => { if (menuProg) handleToggleActivo(menuProg); }}
            className="w-full text-left p-4 rounded-xl hover:bg-gray-50 border border-gray-200 transition-colors flex items-center gap-3"
          >
            <Power className={`w-5 h-5 ${menuProg?.activo ? 'text-warning' : 'text-success'}`} />
            <div>
              <p className="font-medium text-gray-800">
                {menuProg?.activo ? 'Desactivar programación' : 'Reactivar programación'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {menuProg?.activo ? 'No se mostrará en la vista principal' : 'Volverá a aparecer en la vista de activas'}
              </p>
            </div>
          </button>
          <button
            onClick={() => { if (menuProg) abrirDetalles(menuProg); }}
            className="w-full text-left p-4 rounded-xl hover:bg-gray-50 border border-gray-200 transition-colors flex items-center gap-3"
          >
            <Info className="w-5 h-5 text-stage-muted" />
            <div>
              <p className="font-medium text-gray-800">Detalles</p>
              <p className="text-xs text-gray-400 mt-0.5">Ver quién creó y modificó</p>
            </div>
          </button>
          <button
            onClick={() => { setConfirmEliminarProg(menuProg); setMenuProg(null); }}
            className="w-full text-left p-4 rounded-xl hover:bg-red-50 border border-red-100 transition-colors flex items-center gap-3"
          >
            <Trash2 className="w-5 h-5 text-danger" />
            <div>
              <p className="font-medium text-danger">Eliminar programación</p>
              <p className="text-xs text-gray-400 mt-0.5">Se eliminarán todos los responsables asociados</p>
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
        onAsignado={cargarSemana}
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
