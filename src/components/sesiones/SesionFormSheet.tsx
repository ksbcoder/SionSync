import { useState, useEffect } from 'react';
import { BottomSheet } from '../layout/BottomSheet';
import { useSesiones } from '../../hooks/useSesiones';
import { useToast } from '../../hooks/useToast';
import { TouchButton } from '../ui/TouchButton';
import type { Sesion } from '../../domain';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Si se pasa, la hoja edita esa sesión; si no, crea una nueva. */
  sesionExistente?: Sesion | null;
  onGuardado: (sesion: Sesion) => void;
}

export function SesionFormSheet({ isOpen, onClose, sesionExistente, onGuardado }: Props) {
  const { createSesion, updateSesion, loading } = useSesiones();
  const { showToast } = useToast();
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');

  // Al abrir, precargamos los datos de la sesión a editar (o limpiamos si es nueva).
  useEffect(() => {
    if (!isOpen) return;
    setNombre(sesionExistente?.nombre ?? '');
    setFecha(sesionExistente?.fecha ?? '');
  }, [isOpen, sesionExistente]);

  const esEdicion = !!sesionExistente;

  const handleGuardar = async () => {
    if (!nombre.trim()) return;
    const data = { nombre: nombre.trim(), fecha: fecha || null };
    const guardada = esEdicion
      ? await updateSesion(sesionExistente!.id, data)
      : await createSesion(data);
    if (!guardada) return;
    showToast(esEdicion ? 'Sesión actualizada' : 'Sesión creada', 'success');
    onGuardado(guardada);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={esEdicion ? 'Editar sesión' : 'Nueva sesión'}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base"
            placeholder="Ej: Domingo en la mañana"
            value={nombre}
            onChange={e => setNombre(e.target.value.slice(0, 80))}
            maxLength={80}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleGuardar(); }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha (opcional)</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base bg-white"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
          />
        </div>
        <TouchButton variant="primary" fullWidth onClick={handleGuardar} disabled={loading || !nombre.trim()}>
          {loading ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear sesión'}
        </TouchButton>
      </div>
    </BottomSheet>
  );
}
