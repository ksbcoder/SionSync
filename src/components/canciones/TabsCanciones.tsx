import { useNavigate } from 'react-router-dom';

/** Pestañas para alternar entre el catálogo de canciones y las sesiones. */
export function TabsCanciones({ activa }: { activa: 'catalogo' | 'sesiones' }) {
  const navigate = useNavigate();
  const base = 'flex-1 px-3 py-1.5 rounded-md transition-colors text-center';
  const activo = 'bg-white text-brand-700 shadow-sm';
  const inactivo = 'text-gray-500';

  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-0.5 text-sm font-medium max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/canciones')}
        className={`${base} ${activa === 'catalogo' ? activo : inactivo}`}
      >
        Catálogo
      </button>
      <button
        onClick={() => navigate('/canciones/sesiones')}
        className={`${base} ${activa === 'sesiones' ? activo : inactivo}`}
      >
        Sesiones
      </button>
    </div>
  );
}
