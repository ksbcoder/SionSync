import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music2, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useRoles } from '../../hooks/useRoles';
import { OrbeLoader } from '../ui/OrbeLoader';

/**
 * Protege una ruta según los permisos del usuario.
 *
 * `check` recibe lo que devuelve useRoles (isAdmin, canGestionarProgramacion,
 * etc.) y debe devolver true si el usuario puede ver la pantalla.
 *
 * Mientras se cargan los roles muestra un cargando; si no tiene permiso,
 * muestra una pantalla de "sin acceso" en vez de la pantalla real. Es una
 * segunda capa de defensa: la base de datos (RLS) ya bloquea los datos, pero
 * así evitamos que alguien llegue por URL a una pantalla que no le toca.
 */
export function RequireRole({
  check,
  children,
}: {
  check: (roles: ReturnType<typeof useRoles>) => boolean;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const roles = useRoles();

  if (roles.loading) {
    return (
      <div className="min-h-svh bg-app flex items-center justify-center">
        <OrbeLoader />
      </div>
    );
  }

  if (!check(roles)) {
    return (
      <div className="min-h-svh bg-app flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 justify-center mb-8">
            <Music2 className="w-8 h-8 text-brand-700" />
            <h1 className="text-3xl font-bold text-brand-900">SionSync</h1>
          </div>

          <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm text-center">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Sin acceso</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">
              No tienes permisos para entrar a esta sección. Si crees que deberías,
              pídele a un administrador que revise tu rol.
            </p>
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 mx-auto text-brand-700 hover:text-brand-900 font-medium text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
