import { useState, useEffect, useCallback } from 'react';
import { useSesiones } from './useSesiones';
import { calcularSiguienteOrden } from '../domain';
import type { SesionConCanciones } from '../domain';

/**
 * Concentra el estado de la pantalla de detalle de una sesión: la sesión con
 * sus canciones ordenadas y las acciones para agregar, quitar y reordenar.
 */
export function useSesionDetalle(id: string | undefined) {
  const { getSesion, agregarVarias, quitarCancion, reordenar } = useSesiones();
  const [sesion, setSesion] = useState<SesionConCanciones | null>(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const data = await getSesion(id);
    setSesion(data);
    setLoading(false);
  }, [id, getSesion]);

  useEffect(() => { cargar(); }, [cargar]);

  const canciones = [...(sesion?.canciones ?? [])].sort((a, b) => a.orden - b.orden);

  // Agrega varias canciones del catálogo al final de la sesión, en bloque.
  const agregarCanciones = useCallback(async (cancionIds: string[]) => {
    if (!id || cancionIds.length === 0) return;
    let orden = calcularSiguienteOrden(sesion?.canciones ?? []);
    const items = cancionIds.map(cancionId => ({ cancionId, orden: orden++ }));
    await agregarVarias(id, items);
    await cargar();
  }, [id, sesion, agregarVarias, cargar]);

  // Quita la canción de la sesión al instante; si el servidor rechaza, revierte.
  const quitar = useCallback(async (sesionCancionId: string) => {
    const previo = sesion;
    setSesion(s => s ? { ...s, canciones: s.canciones.filter(c => c.id !== sesionCancionId) } : s);
    const ok = await quitarCancion(sesionCancionId);
    if (!ok) setSesion(previo);
  }, [sesion, quitarCancion]);

  // Intercambia el orden de una canción con su vecina (arriba o abajo). Aplica
  // el nuevo orden en pantalla al instante y, si el servidor falla, revierte.
  const mover = useCallback(async (sesionCancionId: string, direccion: 'arriba' | 'abajo') => {
    const ordenadas = [...(sesion?.canciones ?? [])].sort((a, b) => a.orden - b.orden);
    const idx = ordenadas.findIndex(c => c.id === sesionCancionId);
    if (direccion === 'arriba' && idx <= 0) return;
    if (direccion === 'abajo' && idx === ordenadas.length - 1) return;
    const swapIdx = direccion === 'arriba' ? idx - 1 : idx + 1;
    const nuevosOrdenes = ordenadas.map((c, i) => {
      if (i === idx) return { id: c.id, orden: ordenadas[swapIdx].orden };
      if (i === swapIdx) return { id: c.id, orden: ordenadas[idx].orden };
      return { id: c.id, orden: c.orden };
    });

    const ordenPorId = new Map(nuevosOrdenes.map(o => [o.id, o.orden]));
    const previo = sesion;
    setSesion(s => s ? { ...s, canciones: s.canciones.map(c => ({ ...c, orden: ordenPorId.get(c.id) ?? c.orden })) } : s);
    const ok = await reordenar(nuevosOrdenes);
    if (!ok) setSesion(previo);
  }, [sesion, reordenar]);

  return { sesion, loading, canciones, cargar, agregarCanciones, quitar, mover };
}
