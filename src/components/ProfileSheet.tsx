import { useState, useEffect } from 'react';
import { Pencil, Check, X, Bell, BellOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useToast } from '../hooks/useToast';
import { usuarioRepository } from '../infrastructure/usuario.repository';
import { BottomSheet } from './layout/BottomSheet';

interface ProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileSheet({ isOpen, onClose }: ProfileSheetProps) {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name || '';
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const { estado, procesando, activar, desactivar } = usePushNotifications();
  const { showToast } = useToast();

  const handleToggleNotificaciones = async () => {
    try {
      if (estado === 'activo') {
        await desactivar();
        showToast('Notificaciones desactivadas', 'success');
      } else {
        await activar();
        if (Notification.permission === 'granted') {
          showToast('Notificaciones activadas en este dispositivo', 'success');
        }
      }
    } catch {
      showToast('No se pudo cambiar las notificaciones', 'error');
    }
  };

  useEffect(() => {
    if (isOpen) setEditing(false);
  }, [isOpen]);

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
    await usuarioRepository.updateDisplayName(user.id, editValue.trim());
    setEditing(false);
    setSaving(false);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Mi perfil">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wide">Nombre</label>
            {editing ? (
              <div className="flex items-start gap-2 mt-1">
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

          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wide">Notificaciones</label>
            {estado === 'no-soportado' ? (
              <p className="text-sm text-slate-500 mt-1">
                Este navegador no permite notificaciones. En iPhone, agrega antes la app a la
                pantalla de inicio.
              </p>
            ) : estado === 'denegado' ? (
              <p className="text-sm text-slate-500 mt-1">
                Las notificaciones están bloqueadas. Actívalas desde los ajustes del navegador
                para este sitio.
              </p>
            ) : (
              <div className="flex items-center justify-between gap-3 mt-1">
                <p className="text-sm text-slate-600">
                  {estado === 'activo'
                    ? 'Recibes recordatorios en este dispositivo.'
                    : 'Activa los recordatorios de tus responsabilidades.'}
                </p>
                <button
                  onClick={handleToggleNotificaciones}
                  disabled={procesando || estado === 'cargando'}
                  className={`shrink-0 min-h-[40px] px-3 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                    estado === 'activo'
                      ? 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                      : 'text-white bg-brand-500 hover:bg-brand-600'
                  }`}
                >
                  {estado === 'activo' ? (
                    <>
                      <BellOff className="w-4 h-4" /> Desactivar
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" /> {procesando ? 'Activando...' : 'Activar'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
    </BottomSheet>
  );
}
