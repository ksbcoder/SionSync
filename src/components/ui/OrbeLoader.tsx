import { OrbePensante } from './OrbePensante';

/**
 * Único loader de pantalla completa de la app: arranque (sesión, rol,
 * consentimiento), listas, detalles y catálogos. Antes convivía con un
 * DotLoader de tres puntos para las "puertas de acceso"; se unificó todo en el
 * orbe índigo para que la espera se vea igual en toda la app.
 */
export function OrbeLoader({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-gray-50">
      <OrbePensante state="searching" size={64} label={text ?? 'Cargando...'} />
      {text && <p className="text-sm text-gray-400">{text}</p>}
    </div>
  );
}
