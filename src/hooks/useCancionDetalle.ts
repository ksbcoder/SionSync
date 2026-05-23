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

  const agregarSeccion = useCallback(async (data: { tipo: TipoSeccion; letra: string }) => {
    if (!id || !cancion) return;
    const orden = calcularSiguienteOrden(cancion.secciones ?? []);
    await addSeccion({ cancion_id: id, tipo: data.tipo, letra: data.letra, orden });
    await cargar();
  }, [id, cancion, addSeccion, cargar]);

  const editarSeccion = useCallback(async (seccionId: string, data: { tipo: TipoSeccion; letra: string }) => {
    await updateSeccion(seccionId, data);
    await cargar();
  }, [updateSeccion, cargar]);

  const eliminarSeccion = useCallback(async (seccionId: string) => {
    await deleteSeccion(seccionId);
    await cargar();
  }, [deleteSeccion, cargar]);

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
    await reordenarSecciones(newOrdenes);
    await cargar();
  }, [cancion, reordenarSecciones, cargar]);

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
    await addNota({ seccion_id: seccionId, orden, contenido });
    await cargar();
  }, [cancion, addNota, cargar]);

  const editarNota = useCallback(async (notaId: string, contenido: string) => {
    await updateNota(notaId, contenido);
    await cargar();
  }, [updateNota, cargar]);

  const eliminarNota = useCallback(async (notaId: string) => {
    await deleteNota(notaId);
    await cargar();
  }, [deleteNota, cargar]);

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
    agregarNota,
    editarNota,
    eliminarNota,
  };
}
