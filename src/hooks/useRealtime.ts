import { useEffect, useRef } from 'react';
import { supabase } from '../infrastructure/supabase';

/**
 * Se suscribe a los cambios en tiempo real de una o varias tablas y ejecuta
 * `onCambio` cada vez que algo cambia (inserción, edición o borrado).
 *
 * Pensado para mantener una pantalla al día cuando otro dispositivo modifica
 * los mismos datos. Internamente agrupa los avisos: si llegan varios seguidos
 * (p. ej. al asignar varios responsables), recarga una sola vez.
 */
export function useRealtime(tablas: string[], onCambio: () => void) {
  // Guardamos la última versión de la función para no recrear la suscripción
  // cada vez que el componente se vuelve a dibujar.
  const callbackRef = useRef(onCambio);
  callbackRef.current = onCambio;

  // `tablas` suele venir como un arreglo nuevo en cada render; lo convertimos
  // a texto para detectar cambios reales en su contenido, no en la referencia.
  const clave = tablas.join(',');

  useEffect(() => {
    let temporizador: ReturnType<typeof setTimeout> | null = null;

    const recargarAgrupado = () => {
      if (temporizador) clearTimeout(temporizador);
      temporizador = setTimeout(() => callbackRef.current(), 250);
    };

    const canal = supabase.channel(`realtime-${clave}`);
    for (const tabla of clave.split(',')) {
      canal.on('postgres_changes', { event: '*', schema: 'public', table: tabla }, recargarAgrupado);
    }
    canal.subscribe();

    return () => {
      if (temporizador) clearTimeout(temporizador);
      supabase.removeChannel(canal);
    };
  }, [clave]);
}
