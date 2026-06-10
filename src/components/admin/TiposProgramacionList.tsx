import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { programacionRepository } from '../../infrastructure/programacion.repository';
import { ConfirmSheet } from '../ui/ConfirmSheet';
import { DotLoader } from '../ui/DotLoader';
import { useToast } from '../../hooks/useToast';
import { COLORES_TIPO_PROGRAMACION } from '../../domain';
import type { TipoProgramacion } from '../../domain';

interface SelectorColorProps {
  value: string;
  onChange: (color: string) => void;
}

function SelectorColor({ value, onChange }: SelectorColorProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLORES_TIPO_PROGRAMACION.map(color => {
        const seleccionado = color === value;
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`w-7 h-7 rounded-full transition-transform ${seleccionado ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'}`}
            style={{ backgroundColor: color }}
            aria-label={`Color ${color}`}
          />
        );
      })}
    </div>
  );
}

export function TiposProgramacionList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tipos, setTipos] = useState<TipoProgramacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [creando, setCreando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoColor, setNuevoColor] = useState<string>(COLORES_TIPO_PROGRAMACION[0]);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoNombre, setEditandoNombre] = useState('');
  const [editandoColor, setEditandoColor] = useState<string>(COLORES_TIPO_PROGRAMACION[0]);

  const [confirmEliminar, setConfirmEliminar] = useState<TipoProgramacion | null>(null);

  const cargar = async () => {
    setLoading(true);
    const data = await programacionRepository.getTipos();
    setTipos(data);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const handleCrear = async () => {
    const nombre = nuevoNombre.trim();
    if (!nombre) return;
    setSaving(true);
    try {
      await programacionRepository.createTipo(nombre, nuevoColor);
      setNuevoNombre('');
      setNuevoColor(COLORES_TIPO_PROGRAMACION[0]);
      setCreando(false);
      await cargar();
      showToast('Tipo creado', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al crear el tipo', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = async () => {
    const nombre = editandoNombre.trim();
    if (!editandoId || !nombre) return;
    setSaving(true);
    try {
      await programacionRepository.updateTipo(editandoId, nombre, editandoColor);
      setEditandoId(null);
      setEditandoNombre('');
      await cargar();
      showToast('Tipo actualizado', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al actualizar el tipo', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!confirmEliminar) return;
    setSaving(true);
    try {
      await programacionRepository.deleteTipo(confirmEliminar.id);
      await cargar();
      showToast('Tipo eliminado', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al eliminar el tipo', 'error');
    } finally {
      setSaving(false);
    }
  };

  const iniciarEdicion = (tipo: TipoProgramacion) => {
    setEditandoId(tipo.id);
    setEditandoNombre(tipo.nombre);
    setEditandoColor(tipo.color);
    setCreando(false);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditandoNombre('');
  };

  const fabOculto = creando || !!editandoId;

  return (
    <div className="min-h-svh bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 flex items-center gap-2 px-4 py-3 z-10">
        <button onClick={() => navigate('/administracion')} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-lg font-semibold text-gray-800">Tipos de Programación</h1>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        {creando && (
          <div className="mb-4 bg-white rounded-xl border border-brand-200 p-4 flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-700">Nuevo tipo</p>
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={nuevoNombre}
                onChange={e => setNuevoNombre(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCrear()}
                placeholder="Nombre del tipo"
                className="flex-1 h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
              <button
                onClick={handleCrear}
                disabled={saving || !nuevoNombre.trim()}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => { setCreando(false); setNuevoNombre(''); }}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SelectorColor value={nuevoColor} onChange={setNuevoColor} />
          </div>
        )}

        {loading ? (
          <DotLoader text="Cargando tipos..." />
        ) : tipos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No hay tipos de programación</p>
        ) : (
          <div className="flex flex-col gap-3">
            {tipos.map(tipo => (
              <div key={tipo.id} className="bg-white rounded-xl border border-gray-200 p-4">
                {editandoId === tipo.id ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={editandoNombre}
                        onChange={e => setEditandoNombre(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleEditar()}
                        className="flex-1 h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                      />
                      <button
                        onClick={handleEditar}
                        disabled={saving || !editandoNombre.trim()}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={cancelarEdicion}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <SelectorColor value={editandoColor} onChange={setEditandoColor} />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: tipo.color }}
                      />
                      <p className="font-medium text-gray-800 truncate">{tipo.nombre}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => iniciarEdicion(tipo)}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmEliminar(tipo)}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {!fabOculto && (
        <button
          onClick={() => { setCreando(true); setEditandoId(null); }}
          className="fixed right-4 w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg flex items-center justify-center z-50 active:scale-95 transition-transform"
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          aria-label="Nuevo tipo"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <ConfirmSheet
        isOpen={!!confirmEliminar}
        onClose={() => setConfirmEliminar(null)}
        onConfirm={handleEliminar}
        title={`¿Eliminar "${confirmEliminar?.nombre}"?`}
        description="Si hay programaciones usando este tipo, no se podrá eliminar."
      />
    </div>
  );
}
