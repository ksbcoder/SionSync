import { useState } from 'react';
import { Music2 } from 'lucide-react';
import { useConsent } from '../../hooks/useConsent';
import { useAuth } from '../../hooks/useAuth';
import { PoliticaDatos } from './PoliticaDatos';
import { OrbeLoader } from '../ui/OrbeLoader';
import type { ReactNode } from 'react';

export function ConsentGate({ children }: { children: ReactNode }) {
  const { hasConsent, loading, acceptConsent } = useConsent();
  const { signOut } = useAuth();
  const [showPolitica, setShowPolitica] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-svh bg-app flex items-center justify-center">
        <OrbeLoader />
      </div>
    );
  }

  if (hasConsent) return <>{children}</>;

  if (showPolitica) {
    return <PoliticaDatos onBack={() => setShowPolitica(false)} />;
  }

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      await acceptConsent();
    } catch {
      setError('Error al guardar el consentimiento. Intenta de nuevo.');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-svh bg-app flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 justify-center mb-8">
          <Music2 className="w-8 h-8 text-brand-700" />
          <h1 className="text-3xl font-bold text-brand-900">SionSync</h1>
        </div>

        <div className="bg-white rounded-2xl border border-brand-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-3 text-center">
            Política de Tratamiento de Datos
          </h2>

          <p className="text-sm text-slate-500 mb-5 text-center leading-relaxed">
            Para continuar usando SionSync, necesitamos que leas y aceptes nuestra
            política de tratamiento de datos personales.
          </p>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-xl mb-4">
              {error}
            </div>
          )}

          <button
            onClick={() => setShowPolitica(true)}
            className="w-full border border-brand-200 text-brand-700 py-3 rounded-xl font-medium hover:bg-brand-50 transition-colors text-sm mb-3"
          >
            Leer política completa
          </button>

          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-brand-700 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
          >
            {accepting ? 'Guardando...' : 'Acepto la política de tratamiento de datos'}
          </button>

          <button
            onClick={signOut}
            className="w-full text-slate-400 hover:text-slate-600 py-2 mt-3 text-sm transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
