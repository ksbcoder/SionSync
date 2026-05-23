import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CalendarDays } from 'lucide-react';

const OPCIONES = [
  {
    label: 'Gestión de Usuarios',
    description: 'Roles, activación y permisos',
    icon: Users,
    ruta: '/administracion/usuarios',
    enabled: true,
  },
  {
    label: 'Programación',
    description: 'Próximamente',
    icon: CalendarDays,
    ruta: '/administracion/programacion',
    enabled: false,
  },
];

export function AdminHome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-svh bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 flex items-center gap-2 px-4 py-3 z-10">
        <button onClick={() => navigate('/')} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">Administración</h1>
      </header>

      <main className="px-4 py-4 flex flex-col gap-3 max-w-lg mx-auto">
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
