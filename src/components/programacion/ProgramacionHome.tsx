import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2, Bell, BellOff } from 'lucide-react';
import { useRoles } from '../../hooks/useRoles';
import { useProgramaciones, useResponsables } from '../../hooks/useProgramaciones';
import { DotLoader } from '../ui/DotLoader';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmSheet } from '../ui/ConfirmSheet';
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
  const { getProgramaciones, loading: loadingProg } = useProgramaciones();
  const { getResponsablesFecha, eliminarResponsable, marcarNotificado, loading: loadingResp } = useResponsables();

  const [fecha, setFecha] = useState(hoy);
  const [programaciones, setProgramaciones] = useState<Programacion[]>([]);
  const [responsables, setResponsables] = useState<ResponsableProgramacion[]>([]);
  const [asignarPara, setAsignarPara] = useState<Programacion | null>(null);
  const [crearOpen, setCrearOpen] = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState<string | null>(null);

  const [todasProgramaciones, setTodasProgramaciones] = useState<Programacion[]>([]);

  const cargarProgramaciones = useCallback(async () => {
    const data = await getProgramaciones();
    const todas = data ?? [];
    setTodasProgramaciones(todas);
    setProgramaciones(todas.filter(p => p.activo));
  }, [getProgramaciones]);

  const cargarResponsables = useCallback(async () => {
    const data = await getResponsablesFecha(fecha);
    setResponsables(data ?? []);
  }, [getResponsablesFecha, fecha]);

  useEffect(() => { cargarProgramaciones(); }, [cargarProgramaciones]);
  useEffect(() => { cargarResponsables(); }, [cargarResponsables]);

  const handleEliminar = async () => {
    if (!confirmEliminar) return;
    await eliminarResponsable(confirmEliminar);
    setResponsables(prev => prev.filter(r => r.id !== confirmEliminar));
  };

  const handleToggleNotificado = async (resp: ResponsableProgramacion) => {
    if (resp.notificado) return;
    await marcarNotificado(resp.id);
    setResponsables(prev => prev.map(r => r.id === resp.id ? { ...r, notificado: true } : r));
  };

  const responsablesPorProg = (progId: string) =>
    responsables.filter(r => r.programacion_id === progId);

  const loading = loadingProg || loadingResp;

  return (
    <div className="min-h-svh bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 flex items-center gap-2 px-4 py-3 z-10">
        <button onClick={() => navigate('/')} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-lg font-semibold text-gray-800">Programación</h1>
        {canGestionarProgramacion && (
          <button
            onClick={() => setCrearOpen(true)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"
            title="Nueva programación"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
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
        {loading && !programaciones.length ? (
          <DotLoader text="Cargando programación..." />
        ) : programaciones.length === 0 ? (
          <EmptyState
            title="No hay programaciones activas"
            description="Crea una programación para empezar a asignar responsables"
          />
        ) : (
          programaciones.map(prog => {
            const resps = responsablesPorProg(prog.id);
            return (
              <div key={prog.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500" />
                    <h2 className="font-semibold text-gray-800">
                      {prog.tipos_programacion?.nombre ?? 'Programación'}
                    </h2>
                  </div>
                  {canGestionarProgramacion && (
                    <button
                      onClick={() => setAsignarPara(prog)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      title="Asignar responsable"
                    >
                      <Plus className="w-5 h-5" />
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
                            {canGestionarProgramacion && (
                              <>
                                <button
                                  onClick={() => handleToggleNotificado(resp)}
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
                                  onClick={() => setConfirmEliminar(resp.id)}
                                  className="min-h-[36px] min-w-[36px] flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Quitar responsable"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {!canGestionarProgramacion && resp.notificado && (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Notificado</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>

      <AsignarResponsableSheet
        isOpen={!!asignarPara}
        onClose={() => setAsignarPara(null)}
        programacion={asignarPara}
        fecha={fecha}
        responsablesExistentes={asignarPara ? responsablesPorProg(asignarPara.id) : []}
        onAsignado={cargarResponsables}
      />

      <CrearProgramacionSheet
        isOpen={crearOpen}
        onClose={() => setCrearOpen(false)}
        programacionesExistentes={todasProgramaciones}
        onCreada={cargarProgramaciones}
      />

      <ConfirmSheet
        isOpen={!!confirmEliminar}
        onClose={() => setConfirmEliminar(null)}
        onConfirm={handleEliminar}
        title="¿Quitar este responsable?"
        description="Se eliminará la asignación para esta fecha."
      />
    </div>
  );
}
