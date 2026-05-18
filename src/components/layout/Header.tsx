import { Link } from 'react-router-dom';
import { Music2, Plus } from 'lucide-react';

interface HeaderProps {
  onNuevaCancion?: () => void;
}

export function Header({ onNuevaCancion }: HeaderProps) {
  return (
    <header className="hidden md:flex items-center justify-between px-6 py-4 bg-white border-b border-brand-100 sticky top-0 z-30">
      <Link to="/" className="flex items-center gap-2 text-brand-700 font-bold text-xl">
        <Music2 className="w-6 h-6" />
        SionSync
      </Link>
      {onNuevaCancion && (
        <button
          onClick={onNuevaCancion}
          className="flex items-center gap-2 bg-brand-700 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Nueva Canción
        </button>
      )}
    </header>
  );
}
