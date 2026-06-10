import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music2, Settings, CalendarDays, LogOut, UserCircle, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useRoles } from '../hooks/useRoles';
import { ProfileSheet } from './ProfileSheet';
import { DotLoader } from './ui/DotLoader';

export function Home() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, isMiembroNuevo, loading: loadingRoles } = useRoles();
  const [profileOpen, setProfileOpen] = useState(false);

  const opciones = [
    {
      label: 'Canciones',
      description: 'Gestiona y presenta canciones de alabanza',
      icon: Music2,
      ruta: '/canciones',
      enabled: true,
    },
    ...(isAdmin ? [{
      label: 'Administración',
      description: 'Usuarios, roles y configuración',
      icon: Settings,
      ruta: '/administracion',
      enabled: true,
    }] : []),
    {
      label: 'Programación',
      description: 'Responsables de aseo y sonido',
      icon: CalendarDays,
      ruta: '/programacion',
      enabled: true,
    },
  ];

  return (
    <div className="min-h-svh bg-app flex flex-col">
      <header className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <Music2 className="w-7 h-7 text-brand-700" />
            <h1 className="text-2xl font-bold text-brand-900">SionSync</h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setProfileOpen(true)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-700 hover:text-brand-900 transition-colors"
              title="Mi perfil"
            >
              <UserCircle className="w-5 h-5" />
            </button>
            <button
              onClick={signOut}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-700 hover:text-brand-900 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-slate-500 text-sm pl-10">
          Hola, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'usuario'}
        </p>
      </header>

      <main className="flex-1 px-4 flex flex-col gap-3 max-w-lg mx-auto w-full">
        {loadingRoles ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <DotLoader />
          </div>
        ) : isMiembroNuevo ? (
          <div className="bg-white rounded-2xl border border-amber-200 p-6 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-7 h-7 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Cuenta pendiente de activación</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Tu cuenta fue creada correctamente, pero aún no tiene un rol asignado.
              Pídele a un administrador que te promueva para acceder a los módulos de la aplicación.
            </p>
          </div>
        ) : opciones.map(({ label, description, icon: Icon, ruta, enabled }) => (
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

      <ProfileSheet isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
