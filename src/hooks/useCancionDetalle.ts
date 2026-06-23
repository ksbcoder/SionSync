import { useState, useEffect, useCallback } from 'react';
import { useCanciones } from './useCanciones';
import { useSecciones } from './useSecciones';
import { useNotas } from './useNotas';
import { calcularSiguienteOrden } from '../domain';
import type { Cancion, TipoSeccion } from '../domain';

export function useCancionDetalle(id: string | undefined) {
  const { getCancion, deleteCancion } = useCanciones();
  const { addSeccion, updateSeccion, deleteSeccion, reordenarSecciones, duplicarSeccion } = useSecciones();
  const { addNota, updateNota, deleteNota } = useNotas();

  const [cancion, setCancion] = useState<Cancion | null>(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const data = await getCancion(id);
    setCancion(data);
    setLoading(false);
  }, [id, getCancion]);

  useEffect(() => { cargar(); }, [cargar]);

  const secciones = [...(cancion?.secciones ?? [])].sort((a, b) => a.orden - b.orden);

  const eliminarCancion = useCallback(async () => {
    if (!id) return false;
    return deleteCancion(id);
  }, [id, deleteCancion]);

  const agregarSeccion = useCallback(async (data: { tipo: TipoSeccion; letra: string; descripcion: string | null }) => {
    if (!id || !cancion) return;
    const orden = calcularSiguienteOrden(cancion.secciones ?? []);
    const nueva = await addSeccion({ cancion_id: id, tipo: data.tipo, letra: data.letra, descripcion: data.descripcion, orden });
    if (nueva) setCancion(c => c ? { ...c, secciones: [...(c.secciones ?? []), { ...nueva, notas: [] }] } : c);
  }, [id, cancion, addSeccion]);

  // Aplica el cambio en pantalla al instante; si el servidor falla, revierte.
  const editarSeccion = useCallback(async (seccionId: string, data: { tipo: TipoSeccion; letra: string; descripcion: string | null }) => {
    const previo = cancion;
    setCancion(c => c ? { ...c, secciones: c.secciones?.map(s => s.id === seccionId ? { ...s, ...data } : s) } : c);
    const ok = await updateSeccion(seccionId, data);
    if (!ok) setCancion(previo);
  }, [cancion, updateSeccion]);

  const eliminarSeccion = useCallback(async (seccionId: string) => {
    const previo = cancion;
    setCancion(c => c ? { ...c, secciones: c.secciones?.filter(s => s.id !== seccionId) } : c);
    const ok = await deleteSeccion(seccionId);
    if (!ok) setCancion(previo);
  }, [cancion, deleteSeccion]);

  const moverSeccion = useCallback(async (seccionId: string, direccion: 'arriba' | 'abajo') => {
    const sorted = [...(cancion?.secciones ?? [])].sort((a, b) => a.orden - b.orden);
    const idx = sorted.findIndex(s => s.id === seccionId);
    if (direccion === 'arriba' && idx === 0) return;
    if (direccion === 'abajo' && idx === sorted.length - 1) return;
    const swapIdx = direccion === 'arriba' ? idx - 1 : idx + 1;
    const newOrdenes = sorted.map((s, i) => {
      if (i === idx) return { id: s.id, orden: sorted[swapIdx].orden };
      if (i === swapIdx) return { id: s.id, orden: sorted[idx].orden };
      return { id: s.id, orden: s.orden };
    });

    const ordenPorId = new Map(newOrdenes.map(o => [o.id, o.orden]));
    const previo = cancion;
    setCancion(c => c ? { ...c, secciones: c.secciones?.map(s => ({ ...s, orden: ordenPorId.get(s.id) ?? s.orden })) } : c);
    const ok = await reordenarSecciones(newOrdenes);
    if (!ok) setCancion(previo);
  }, [cancion, reordenarSecciones]);

  // Marca qué secciones se cantan AL MISMO TIEMPO que 'seccionId'. Las que
  // comparten 'grupo_simultaneo' forman un grupo. Si el grupo final queda con
  // menos de 2 miembros, se deshace (un grupo de una sola sección no tiene sentido).
  const vincularSimultaneas = useCallback(async (seccionId: string, idsSeleccionadas: string[]) => {
    if (!cancion) return;
    const secciones = cancion.secciones ?? [];
    const actual = secciones.find(s => s.id === seccionId);
    if (!actual) return;

    const grupoId = actual.grupo_simultaneo ?? crypto.randomUUID();
    const miembros = new Set([seccionId, ...idsSeleccionadas]);

    // 1) Valor tentativo de grupo para cada sección.
    const final = new Map<string, string | null>();
    for (const s of secciones) {
      if (miembros.has(s.id)) {
        final.set(s.id, grupoId);
      } else if (actual.grupo_simultaneo && s.grupo_simultaneo === actual.grupo_simultaneo) {
        // Estaba en este grupo y ahora se deseleccionó: sale del grupo.
        final.set(s.id, null);
      } else {
        final.set(s.id, s.grupo_simultaneo ?? null);
      }
    }

    // 2) Cualquier grupo que quede con un solo miembro se deshace.
    const conteo = new Map<string, number>();
    for (const g of final.values()) if (g) conteo.set(g, (conteo.get(g) ?? 0) + 1);
    for (const [sid, g] of final) if (g && conteo.get(g) === 1) final.set(sid, null);

    // 3) Persistir solo las secciones cuyo grupo cambió (optimista).
    const cambios = secciones.filter(s => (s.grupo_simultaneo ?? null) !== (final.get(s.id) ?? null));
    if (cambios.length === 0) return;

    const previo = cancion;
    setCancion(c => c ? { ...c, secciones: c.secciones?.map(s => ({ ...s, grupo_simultaneo: final.get(s.id) ?? null })) } : c);
    for (const s of cambios) {
      const ok = await updateSeccion(s.id, { grupo_simultaneo: final.get(s.id) ?? null });
      if (!ok) { setCancion(previo); return; }
    }
  }, [cancion, updateSeccion]);

  const duplicar = useCallback(async (seccionId: string) => {
    if (!cancion) return;
    const seccion = cancion.secciones?.find(s => s.id === seccionId);
    if (!seccion) return;
    const orden = calcularSiguienteOrden(cancion.secciones ?? []);
    await duplicarSeccion(seccion, orden);
    await cargar();
  }, [cancion, duplicarSeccion, cargar]);

  const agregarNota = useCallback(async (seccionId: string, contenido: string) => {
    const seccion = cancion?.secciones?.find(s => s.id === seccionId);
    const orden = seccion?.notas?.length ?? 0;
    const nueva = await addNota({ seccion_id: seccionId, orden, contenido });
    if (nueva) setCancion(c => c ? {
      ...c,
      secciones: c.secciones?.map(s => s.id === seccionId ? { ...s, notas: [...(s.notas ?? []), nueva] } : s),
    } : c);
  }, [cancion, addNota]);

  const editarNota = useCallback(async (notaId: string, contenido: string) => {
    const previo = cancion;
    setCancion(c => c ? {
      ...c,
      secciones: c.secciones?.map(s => ({
        ...s,
        notas: s.notas?.map(n => n.id === notaId ? { ...n, contenido } : n),
      })),
    } : c);
    const ok = await updateNota(notaId, contenido);
    if (!ok) setCancion(previo);
  }, [cancion, updateNota]);

  const eliminarNota = useCallback(async (notaId: string) => {
    const previo = cancion;
    setCancion(c => c ? {
      ...c,
      secciones: c.secciones?.map(s => ({
        ...s,
        notas: s.notas?.filter(n => n.id !== notaId),
      })),
    } : c);
    const ok = await deleteNota(notaId);
    if (!ok) setCancion(previo);
  }, [cancion, deleteNota]);

  return {
    cancion,
    loading,
    secciones,
    eliminarCancion,
    agregarSeccion,
    editarSeccion,
    eliminarSeccion,
    moverSeccion,
    duplicar,
    vincularSimultaneas,
    agregarNota,
    editarNota,
    eliminarNota,
  };
}
