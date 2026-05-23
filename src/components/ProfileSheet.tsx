import { useState, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usuarioService } from '../application/usuario.service';
import { BottomSheet } from './layout/BottomSheet';

interface ProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onNameUpdated?: () => void;
}

export function ProfileSheet({ isOpen, onClose, onNameUpdated }: ProfileSheetProps) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !user) return;
    setEditing(false);
    setLoading(true);
    usuarioService.getProfile(user.id).then(profile => {
      setDisplayName(profile?.display_name ?? '');
      setLoading(false);
    });
  }, [isOpen, user]);

  const handleEdit = () => {
    setEditValue(displayName);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    if (!user || !editValue.trim()) return;
    setSaving(true);
    await usuarioService.updateDisplayName(user.id, editValue.trim());
    setDisplayName(editValue.trim());
    setEditing(false);
    setSaving(false);
    onNameUpdated?.();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Mi perfil">
      {loading ? (
        <div className="py-8 text-center text-slate-400 text-sm">Cargando...</div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wide">Nombre</label>
            {editing ? (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1">
                  <input
                    type="text"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value.slice(0, 50))}
                    maxLength={50}
                    className="w-full border border-brand-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSave();
                      if (e.key === 'Escape') handleCancel();
                    }}
                  />
                  <p className={`text-xs mt-1 ${editValue.length >= 45 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {editValue.length}/50
                  </p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving || !editValue.trim()}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-40"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCancel}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:bg-slate-50 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-slate-800 font-medium">{displayName}</p>
                <button
                  onClick={handleEdit}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg"
                  title="Editar nombre"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wide">Correo</label>
            <p className="text-sm text-slate-800 mt-1">{user?.email ?? ''}</p>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
