import { useNavigate } from 'react-router-dom';
import { Music2, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const OPCIONES = [
  {
    label: 'Canciones',
    description: 'Gestiona y presenta canciones de alabanza',
    icon: Music2,
    ruta: '/canciones',
    enabled: true,
  },
  {
    label: 'Administración',
    description: 'Próximamente',
    icon: Settings,
    ruta: '/administracion',
    enabled: false,
  },
];

export function Home() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-svh bg-app flex flex-col">
      <header className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <Music2 className="w-7 h-7 text-brand-700" />
            <h1 className="text-2xl font-bold text-brand-900">SionSync</h1>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors text-sm"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <p className="text-slate-500 text-sm pl-10">
          Hola, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'usuario'}
        </p>
      </header>

      <main className="flex-1 px-4 flex flex-col gap-3 max-w-lg mx-auto w-full">
        {OPCIONES.map(({ label, description, icon: Icon, ruta, enabled }) => (
          <button
            key={ruta}
            onClick={() => enabled && navigate(ruta)}
            disabled={!enabled}
            className={`w-full text-left p-5 bg-white rounded-2xl border transition-all flex items-center gap-4
              ${enabled
                ? 'border-brand-100 hover:border-brand-300 hover:shadow-sm active:scale-[0.98]'
                : 'border-gray-100 opacity-50 cursor-not-allowed'
              }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${enabled ? 'bg-brand-100' : 'bg-gray-100'}`}>
              <Icon className={`w-6 h-6 ${enabled ? 'text-brand-700' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{label}</p>
              <p className="text-sm text-slate-400 mt-0.5">{description}</p>
            </div>
          </button>
        ))}
      </main>
    </div>
  );
}
