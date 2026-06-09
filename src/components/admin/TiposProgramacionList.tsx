import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { programacionRepository } from '../../infrastructure/programacion.repository';
import { ConfirmSheet } from '../ui/ConfirmSheet';
import { DotLoader } from '../ui/DotLoader';
import { useToast } from '../../hooks/useToast';
import type { TipoProgramacion } from '../../domain';

export function TiposProgramacionList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tipos, setTipos] = useState<TipoProgramacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [creando, setCreando] = useState(false);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoNombre, setEditandoNombre] = useState('');

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
      await programacionRepository.createTipo(nombre);
      setNuevoNombre('');
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
      await programacionRepository.updateTipo(editandoId, nombre);
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
    setCreando(false);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditandoNombre('');
  };

  return (
    <div className="min-h-svh bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 flex items-center gap-2 px-4 py-3 z-10">
        <button onClick={() => navigate('/administracion')} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-lg font-semibold text-gray-800">Tipos de Programación</h1>
        {!creando && !editandoId && (
          <button
            onClick={() => { setCreando(true); setEditandoId(null); }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"
            title="Nuevo tipo"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        {creando && (
          <div className="mb-4 bg-white rounded-xl border border-brand-200 p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Nuevo tipo</p>
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
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-800">{tipo.nombre}</p>
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
