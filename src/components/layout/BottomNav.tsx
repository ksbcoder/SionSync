import { NavLink } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-brand-100 flex md:hidden z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] text-xs font-medium transition-colors ${isActive ? 'text-brand-500' : 'text-slate-400'}`
        }
      >
        <Home className="w-5 h-5 mb-0.5" />
        Inicio
      </NavLink>
      <NavLink
        to="/buscar"
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] text-xs font-medium transition-colors ${isActive ? 'text-brand-500' : 'text-slate-400'}`
        }
      >
        <Search className="w-5 h-5 mb-0.5" />
        Buscar
      </NavLink>
    </nav>
  );
}
