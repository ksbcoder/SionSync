import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, UserPlus, Power, Info, Copy } from 'lucide-react';
import { useRoles } from '../../hooks/useRoles';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useProgramaciones, useResponsables } from '../../hooks/useProgramaciones';
import { useProgramacionSemana } from '../../hooks/useProgramacionSemana';
import { usuarioRepository } from '../../infrastructure/usuario.repository';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmSheet } from '../ui/ConfirmSheet';
import { BottomSheet } from '../layout/BottomSheet';
import { AsignarResponsableSheet } from './AsignarResponsableSheet';
import { CrearProgramacionSheet } from './CrearProgramacionSheet';
import { DuplicarSemanaSheet } from './DuplicarSemanaSheet';
import { SelectorSemana } from './SelectorSemana';
import { TarjetaProgramacion } from './TarjetaProgramacion';
import { formatFecha } from '../../domain';
import type { Programacion, ResponsableProgramacion } from '../../domain';

export function ProgramacionHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isAdmin, canGestionarProgramacion, canGestionarNotificaciones } = useRoles();
  const { deleteProgramacion, toggleActivo } = useProgramaciones();
  const { eliminarResponsable, toggleNotificado } = useResponsables();

  const {
    fecha,
    setFecha,
    diasSemana,
    todasProgramaciones,
    setTodasProgramaciones,
    responsablesSemana,
    setResponsablesSemana,
    coloresPorFecha,
    cargarSemana,
    loading,
  } = useProgramacionSemana();

  // Agrega una programación recién creada a la lista sin recargar todo.
  const agregarProgramacionLocal = (prog: Programacion) =>
    setTodasProgramaciones(prev => [prog, ...prev]);

  // Refleja en la semana los responsables recién asignados/quitados, sin recargar.
  const aplicarCambiosResponsables = (cambios: { agregados: ResponsableProgramacion[]; quitadosIds: string[] }) =>
    setResponsablesSemana(prev => [
      ...prev.filter(r => !cambios.quitadosIds.includes(r.id)),
      ...cambios.agregados,
    ]);

  const [verInactivas, setVerInactivas] = useState(false);
  const [crearOpen, setCrearOpen] = useState(false);
  const [duplicarOpen, setDuplicarOpen] = useState(false);
  const [asignarPara, setAsignarPara] = useState<Programacion | null>(null);
  const [menuProg, setMenuProg] = useState<Programacion | null>(null);

  const [detallesProg, setDetallesProg] = useState<Programacion | null>(null);
  const [creadorNombre, setCreadorNombre] = useState<string | null>(null);
  const [modificadorNombre, setModificadorNombre] = useState<string | null>(null);

  const [confirmEliminarResp, setConfirmEliminarResp] = useState<string | null>(null);
  const [confirmEliminarProg, setConfirmEliminarProg] = useState<Programacion | null>(null);
  const [confirmNotificado, setConfirmNotificado] = useState<ResponsableProgramacion | null>(null);

  const responsables = responsablesSemana.filter(r => r.fecha === fecha);
  const puedeEditarProg = (prog: Programacion) => isAdmin || (canGestionarProgramacion && prog.user_id === user?.id);

  const mostrandoInactivas = canGestionarProgramacion && verInactivas;
  const filtradas = todasProgramaciones.filter(p => p.activo === !mostrandoInactivas);
  const progsConResponsables = new Set(responsables.map(r => r.programacion_id));
  const programacionesVisibles = canGestionarProgramacion
    ? filtradas
    : filtradas.filter(p => progsConResponsables.has(p.id));

  const responsablesPorProg = (progId: string) =>
    responsables.filter(r => r.programacion_id === progId);

  // Datos para duplicar la semana visible: el lunes (diasSemana[0] ya es el
  // inicio de semana), los servicios activos y cuántas asignaciones tienen.
  const semanaInicio = diasSemana[0];
  const idsActivas = todasProgramaciones.filter(p => p.activo).map(p => p.id);
  const idsActivasSet = new Set(idsActivas);
  const asignacionesActivasSemana = responsablesSemana.filter(r => idsActivasSet.has(r.programacion_id)).length;

  // Todas estas acciones reflejan el cambio en pantalla al instante y, si el
  // servidor falla, revierten al estado anterior (el toast de error lo muestra
  // useAsync). Así el usuario nunca ve una recarga ni un parpadeo de carga.
  const handleEliminarResp = async () => {
    if (!confirmEliminarResp) return;
    const id = confirmEliminarResp;
    const previo = responsablesSemana;
    setResponsablesSemana(prev => prev.filter(r => r.id !== id));
    const ok = await eliminarResponsable(id);
    if (ok) showToast('Responsable eliminado', 'success');
    else setResponsablesSemana(previo);
  };

  const handleEliminarProg = async () => {
    if (!confirmEliminarProg) return;
    const prog = confirmEliminarProg;
    const previo = todasProgramaciones;
    setTodasProgramaciones(prev => prev.filter(p => p.id !== prog.id));
    const ok = await deleteProgramacion(prog.id);
    if (ok) showToast('Programación eliminada', 'success');
    else setTodasProgramaciones(previo);
  };

  const handleToggleNotificado = async () => {
    if (!confirmNotificado) return;
    const resp = confirmNotificado;
    const nuevoEstado = !resp.notificado;
    const previo = responsablesSemana;
    setResponsablesSemana(prev => prev.map(r => r.id === resp.id ? { ...r, notificado: nuevoEstado } : r));
    const ok = await toggleNotificado(resp.id, nuevoEstado);
    if (ok) showToast(nuevoEstado ? 'Marcado como notificado' : 'Marcado como pendiente', 'success');
    else setResponsablesSemana(previo);
  };

  const handleToggleActivo = async (prog: Programacion) => {
    const nuevoEstado = !prog.activo;
    const previo = todasProgramaciones;
    setMenuProg(null);
    setTodasProgramaciones(prev => prev.map(p => p.id === prog.id ? { ...p, activo: nuevoEstado } : p));
    if (nuevoEstado) setVerInactivas(false);
    const ok = await toggleActivo(prog.id, nuevoEstado);
    if (ok) showToast(nuevoEstado ? 'Programación reactivada' : 'Programación desactivada', 'success');
    else setTodasProgramaciones(previo);
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

      <SelectorSemana
        fecha={fecha}
        diasSemana={diasSemana}
        coloresPorFecha={coloresPorFecha}
        onSeleccionar={setFecha}
      />

      {canGestionarProgramacion && !mostrandoInactivas && (
        <div className="px-4 max-w-lg mx-auto w-full">
          <button
            onClick={() => setDuplicarOpen(true)}
            disabled={asignacionesActivasSemana === 0}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            <Copy className="w-4 h-4" />
            Duplicar esta semana
          </button>
        </div>
      )}

      <main className="px-4 py-3 max-w-lg mx-auto flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col gap-4" aria-busy="true" aria-label="Cargando programación">
            {[0, 1].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-40 bg-gray-100 rounded" />
                  <div className="h-8 w-8 bg-gray-100 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
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
          programacionesVisibles.map(prog => (
            <TarjetaProgramacion
              key={prog.id}
              prog={prog}
              responsables={responsablesPorProg(prog.id)}
              puedeEditar={puedeEditarProg(prog)}
              canGestionarNotificaciones={canGestionarNotificaciones}
              onAbrirMenu={setMenuProg}
              onEliminarProg={setConfirmEliminarProg}
              onEliminarResp={setConfirmEliminarResp}
              onToggleNotificado={setConfirmNotificado}
            />
          ))
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
        onAsignado={aplicarCambiosResponsables}
      />

      <CrearProgramacionSheet
        isOpen={crearOpen}
        onClose={() => setCrearOpen(false)}
        programacionesExistentes={todasProgramaciones}
        onCreada={agregarProgramacionLocal}
      />

      <DuplicarSemanaSheet
        isOpen={duplicarOpen}
        onClose={() => setDuplicarOpen(false)}
        semanaOrigenInicio={semanaInicio}
        cantidadAsignaciones={asignacionesActivasSemana}
        programacionIdsActivas={idsActivas}
        onDuplicado={cargarSemana}
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
