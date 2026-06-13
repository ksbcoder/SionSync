import { useState, useEffect, useCallback, useMemo } from 'react';
import { useProgramaciones, useResponsables } from './useProgramaciones';
import { useRealtime } from './useRealtime';
import { useRecargarAlVolver } from './useRecargarAlVolver';
import { inicioSemana, hoy, sumarDias } from '../domain';
import type { Programacion, ResponsableProgramacion } from '../domain';

/**
 * Concentra todo el "estado de datos" de la pantalla de programación: qué fecha
 * está seleccionada, qué programaciones y responsables hay esa semana, y cómo
 * se recargan (incluido el tiempo real y la recarga al volver a la app).
 *
 * Devuelve también los setters para que la pantalla pueda hacer cambios
 * optimistas (reflejar al instante una eliminación sin esperar al servidor).
 */
export function useProgramacionSemana() {
  const { getProgramaciones, loading: loadingProg } = useProgramaciones();
  const { getResponsablesRango, loading: loadingResp } = useResponsables();

  const [fecha, setFecha] = useState(hoy);
  const [todasProgramaciones, setTodasProgramaciones] = useState<Programacion[]>([]);
  const [responsablesSemana, setResponsablesSemana] = useState<ResponsableProgramacion[]>([]);

  const diasSemana = useMemo(() => {
    const inicio = inicioSemana(fecha);
    return Array.from({ length: 7 }, (_, i) => sumarDias(inicio, i));
  }, [fecha]);

  // Para cada día de la semana, los colores de los tipos que tienen
  // responsables asignados (sirve para los puntitos del calendario).
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

  // Solo mostramos el cargando en la primera carga (cuando aún no hay datos),
  // no en las recargas en segundo plano.
  const loading = (loadingProg && !todasProgramaciones.length) || (loadingResp && !responsablesSemana.length);

  return {
    fecha,
    setFecha,
    diasSemana,
    todasProgramaciones,
    setTodasProgramaciones,
    responsablesSemana,
    setResponsablesSemana,
    coloresPorFecha,
    cargarProgramaciones,
    cargarSemana,
    loading,
  };
}
