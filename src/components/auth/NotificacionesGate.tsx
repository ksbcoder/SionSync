import { useState, type ReactNode } from 'react';
import { Music2, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { DotLoader } from '../ui/DotLoader';

// Marca que a ESTE usuario ya se le ofreció activar las notificaciones en ESTE
// dispositivo. La clave incluye el id del usuario para que, en un equipo
// compartido, a cada persona se le ofrezca una vez (no una sola vez por equipo).
const promptKey = (userId: string) => `sionsync_notif_onboarding:${userId}`;

/**
 * Tras aceptar el consentimiento, ofrece UNA sola vez activar las
 * notificaciones en este dispositivo, sin importar el rol del usuario. Si las
 * acepta o las pospone, no se vuelve a preguntar (puede activarlas luego
 * desde su perfil).
 */
export function NotificacionesGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { estado, procesando, activar } = usePushNotifications();
  const [yaOfrecido, setYaOfrecido] = useState(
    () => !!user && localStorage.getItem(promptKey(user.id)) === '1',
  );

  const marcarOfrecido = () => {
    if (user) localStorage.setItem(promptKey(user.id), '1');
    setYaOfrecido(true);
  };

  // Camino rápido: sin usuario, o si ya se le ofreció a este usuario en este
  // dispositivo, no interrumpimos.
  if (!user || yaOfrecido) return <>{children}</>;

  // Esperamos a conocer el estado de las notificaciones.
  if (estado === 'cargando') {
    return (
      <div className="min-h-svh bg-app flex items-center justify-center">
        <DotLoader />
      </div>
    );
  }

  // Ofrecemos solo cuando tiene sentido: el dispositivo puede recibir avisos
  // y aún no los tiene activos. En cualquier otro caso (ya activas, no
  // soportado, bloqueadas) dejamos pasar sin preguntar.
  if (estado !== 'inactivo') return <>{children}</>;

  const handleActivar = async () => {
    try {
      await activar();
    } catch {
      // Si algo falla, seguimos igual; puede reintentar desde su perfil.
    } finally {
      marcarOfrecido();
    }
  };

  return (
    <div className="min-h-svh bg-app flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 justify-center mb-8">
          <Music2 className="w-8 h-8 text-brand-700" />
          <h1 className="text-3xl font-bold text-brand-900">SionSync</h1>
        </div>

        <div className="bg-white rounded-2xl border border-brand-100 p-6 shadow-sm text-center">
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-7 h-7 text-brand-700" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            Activa los recordatorios
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Te avisaremos en este dispositivo cuando te toque una responsabilidad,
            para que no se te pase. Puedes cambiarlo cuando quieras desde tu perfil.
          </p>

          <button
            onClick={handleActivar}
            disabled={procesando}
            className="w-full bg-brand-700 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-sm mb-3"
          >
            {procesando ? 'Activando...' : 'Activar notificaciones'}
          </button>

          <button
            onClick={marcarOfrecido}
            disabled={procesando}
            className="w-full text-slate-400 hover:text-slate-600 py-2 text-sm transition-colors disabled:opacity-50"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
