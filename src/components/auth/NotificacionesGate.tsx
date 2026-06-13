import { useState, useEffect, type ReactNode } from 'react';
import { Music2, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { pushRepository } from '../../infrastructure/push.repository';
import { DotLoader } from '../ui/DotLoader';

/**
 * Tras aceptar el consentimiento, ofrece activar las notificaciones en este
 * dispositivo si —según la base de datos— este usuario aún no tiene una
 * suscripción guardada para este equipo. Consultar la base (y no una marca
 * local) hace la decisión más fiable: refleja el estado real del sistema.
 *
 * Si las activa o las pospone, no se vuelve a preguntar durante esta sesión.
 * En un próximo inicio, si sigue sin suscripción, se le volverá a ofrecer.
 */
export function NotificacionesGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { estado, procesando, activar } = usePushNotifications();
  const [tieneSuscripcion, setTieneSuscripcion] = useState<boolean | null>(null);
  const [pospuesto, setPospuesto] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelado = false;
    pushRepository
      .tieneSuscripcionEnEsteDispositivo()
      .then(existe => { if (!cancelado) setTieneSuscripcion(existe); })
      // Ante una falla (red, etc.) asumimos que sí tiene, para no molestar.
      .catch(() => { if (!cancelado) setTieneSuscripcion(true); });
    return () => { cancelado = true; };
  }, [user]);

  // Sin usuario, o si ya lo pospuso/activó en esta sesión, no interrumpimos.
  if (!user || pospuesto) return <>{children}</>;

  // Esperamos la respuesta de la base de datos y el estado del navegador.
  if (tieneSuscripcion === null || estado === 'cargando') {
    return (
      <div className="min-h-svh bg-app flex items-center justify-center">
        <DotLoader />
      </div>
    );
  }

  // Ya está suscrito en este dispositivo (según la base), o el navegador no
  // puede ofrecerlo (no soportado o bloqueado): seguimos sin preguntar.
  if (tieneSuscripcion || estado === 'no-soportado' || estado === 'denegado') {
    return <>{children}</>;
  }

  const handleActivar = async () => {
    try {
      await activar();
    } catch {
      // Si algo falla, seguimos igual; puede reintentar desde su perfil.
    } finally {
      setPospuesto(true);
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
            onClick={() => setPospuesto(true)}
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
