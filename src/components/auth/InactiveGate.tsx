import { useState, useEffect, type ReactNode } from 'react';
import { Music2, LogOut } from 'lucide-react';
import { usuarioRepository } from '../../infrastructure/usuario.repository';
import { useAuth } from '../../hooks/useAuth';
import { DotLoader } from '../ui/DotLoader';

export function InactiveGate({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [active, setActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    usuarioRepository.getProfile(user.id).then(profile => {
      setActive(profile.active ?? true);
    }).catch(() => {
      setActive(true);
    }).finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-svh bg-app flex items-center justify-center">
        <DotLoader />
      </div>
    );
  }

  if (active === false) {
    return (
      <div className="min-h-svh bg-app flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 justify-center mb-8">
            <Music2 className="w-8 h-8 text-brand-700" />
            <h1 className="text-3xl font-bold text-brand-900">SionSync</h1>
          </div>

          <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm text-center">
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Cuenta desactivada</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">
              Tu cuenta ha sido desactivada por un administrador. Si crees que esto es un error,
              contacta al administrador de tu comunidad.
            </p>
            <button
              onClick={signOut}
              className="flex items-center justify-center gap-2 mx-auto text-brand-700 hover:text-brand-900 font-medium text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
