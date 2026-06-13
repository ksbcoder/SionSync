import { useState, type ReactNode } from 'react';
import { Music2, Bell } from 'lucide-react';
import { useRoles } from '../../hooks/useRoles';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { DotLoader } from '../ui/DotLoader';

// Marca, por dispositivo, que ya se le ofreció activar las notificaciones al
// entrar. Así no se vuelve a interrumpir al usuario en cada inicio de sesión.
const PROMPT_KEY = 'sionsync_notif_onboarding';

/**
 * Tras aceptar el consentimiento y teniendo ya un rol, ofrece UNA sola vez
 * activar las notificaciones en este dispositivo. Si las acepta o las pospone,
 * no se vuelve a preguntar (puede activarlas luego desde su perfil).
 */
export function NotificacionesGate({ children }: { children: ReactNode }) {
  const { isMiembroNuevo, loading: rolesLoading } = useRoles();
  const { estado, procesando, activar } = usePushNotifications();
  const [yaOfrecido, setYaOfrecido] = useState(
    () => localStorage.getItem(PROMPT_KEY) === '1',
  );

  const marcarOfrecido = () => {
    localStorage.setItem(PROMPT_KEY, '1');
    setYaOfrecido(true);
  };

  // Camino rápido: si ya se ofreció en este dispositivo, no interrumpimos.
  if (yaOfrecido) return <>{children}</>;

  // Esperamos a conocer el rol y el estado de las notificaciones.
  if (rolesLoading || estado === 'cargando') {
    return (
      <div className="min-h-svh bg-app flex items-center justify-center">
        <DotLoader />
      </div>
    );
  }

  // Solo ofrecemos a quien ya tiene un rol (tiene responsabilidades que
  // recordar) y cuyo dispositivo puede recibir avisos y aún no los tiene.
  // En cualquier otro caso (sin rol, ya activas, no soportado, bloqueadas)
  // dejamos pasar sin preguntar.
  if (isMiembroNuevo || estado !== 'inactivo') return <>{children}</>;

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
