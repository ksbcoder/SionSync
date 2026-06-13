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

export const pushRepository = {
  /**
   * Guarda (o actualiza) la suscripción de este dispositivo en la base.
   * Si el mismo navegador vuelve a suscribirse, se reemplaza por su endpoint.
   */
  async guardarSuscripcion(sub: PushSubscription): Promise<void> {
    const user_id = await getUserId();
    const json = sub.toJSON();
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id,
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh ?? '',
          auth: json.keys?.auth ?? '',
          user_agent: navigator.userAgent,
        },
        { onConflict: 'endpoint' },
      );
    if (error) throw new Error(error.message);
  },

  /** Borra la suscripción de este dispositivo (al desactivar las notificaciones). */
  async eliminarSuscripcion(endpoint: string): Promise<void> {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);
    if (error) throw new Error(error.message);
  },
};
