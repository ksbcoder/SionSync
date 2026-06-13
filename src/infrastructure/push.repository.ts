import { supabase } from './supabase';
import { getUserId } from './auth';

// La clave pública VAPID viaja en base64url, pero pushManager.subscribe la
// necesita como bytes (Uint8Array). Esta función hace esa conversión.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

export const APPLICATION_SERVER_KEY = VAPID_PUBLIC_KEY
  ? urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  : undefined;

// "Carné" único de ESTE navegador. Se genera una sola vez y se guarda
// localmente; identifica al dispositivo aunque su endpoint (dirección de
// Push) cambie, para no acumular suscripciones duplicadas.
const DEVICE_ID_KEY = 'sionsync_device_id';
function obtenerDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export const pushRepository = {
  /**
   * Guarda (o actualiza) la suscripción de este dispositivo en la base.
   * Si el mismo navegador vuelve a suscribirse, se reemplaza por su endpoint.
   */
  async guardarSuscripcion(sub: PushSubscription): Promise<void> {
    const user_id = await getUserId();
    const json = sub.toJSON();
    // Conflicto sobre (user_id, device_id): si este mismo dispositivo ya
    // tenía una fila, se ACTUALIZA (nuevo endpoint y claves) en vez de crear
    // una nueva. Así nunca quedan duplicados aunque el endpoint rote.
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id,
          device_id: obtenerDeviceId(),
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh ?? '',
          auth: json.keys?.auth ?? '',
          user_agent: navigator.userAgent,
        },
        { onConflict: 'user_id,device_id' },
      );
    if (error) throw new Error(error.message);
  },

  /**
   * Borra la suscripción de ESTE dispositivo (al desactivar las
   * notificaciones). Usa el carné del navegador, así que funciona aunque el
   * navegador ya no entregue la suscripción y no deja la fila huérfana.
   */
  async eliminarSuscripcion(): Promise<void> {
    const user_id = await getUserId();
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user_id)
      .eq('device_id', obtenerDeviceId());
    if (error) throw new Error(error.message);
  },
};
