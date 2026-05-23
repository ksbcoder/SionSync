import { NavLink, useLocation } from 'react-router-dom';
import { Music2, LayoutGrid } from 'lucide-react';

export function BottomNav() {
  const { pathname } = useLocation();
  const enCanciones = pathname.startsWith('/cancion');

  const navItemClass = (isActive: boolean) =>
    `flex-1 flex flex-col items-center justify-center py-3 min-h-[56px] text-xs font-medium transition-colors ${isActive ? 'text-brand-500' : 'text-slate-400'}`;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-white border-t border-brand-100 flex md:hidden z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {!enCanciones && (
        <NavLink
          to="/canciones"
          end
          className={({ isActive }) => navItemClass(isActive)}
        >
          <Music2 className="w-5 h-5 mb-0.5" />
          Canciones
        </NavLink>
      )}
      <NavLink
        to="/"
        end
        className={({ isActive }) => navItemClass(isActive)}
      >
        <LayoutGrid className="w-5 h-5 mb-0.5" />
        Menú
      </NavLink>
    </nav>
  );
}
