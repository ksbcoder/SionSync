import { OrbePensante } from './OrbePensante';

/**
 * Loader de pantalla completa para las cargas de datos que sí tardan (listas,
 * detalles y catálogos). Mismo lugar y mismo fondo que DotLoader, pero con el
 * orbe de puntos en índigo.
 *
 * DotLoader se conserva para las cargas instantáneas —las puertas de acceso—,
 * donde un orbe solo alcanzaría a dar un destello.
 */
export function OrbeLoader({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-gray-50">
      <OrbePensante state="searching" size={64} label={text ?? 'Cargando...'} />
      {text && <p className="text-sm text-gray-400">{text}</p>}
    </div>
  );
}
