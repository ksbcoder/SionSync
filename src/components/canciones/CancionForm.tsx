import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCanciones } from '../../hooks/useCanciones';
import { useSesiones } from '../../hooks/useSesiones';
import { useToast } from '../../hooks/useToast';
import { TouchButton } from '../ui/TouchButton';
import { TONALIDADES, calcularSiguienteOrden } from '../../domain';
import type { Cancion } from '../../domain';

interface CancionFormProps {
  cancionExistente?: Cancion;
}

export function CancionForm({ cancionExistente }: CancionFormProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  // Si venimos desde una sesión, al crear la canción se agrega a esa sesión.
  const sesionId = searchParams.get('sesion');
  const { createCancion, updateCancion, loading } = useCanciones();
  const { getSesion, agregarCancion } = useSesiones();
  const { showToast } = useToast();

  const [titulo, setTitulo] = useState(cancionExistente?.titulo ?? '');
  const [autor, setAutor] = useState(cancionExistente?.autor ?? '');
  const [tonalidad, setTonalidad] = useState(cancionExistente?.tonalidad ?? '');
  const [tempo, setTempo] = useState<string>(cancionExistente?.tempo?.toString() ?? '');

  const handleSubmit = async () => {
    if (!titulo.trim()) return;

    // El min/max del campo solo controla las flechitas; validamos el rango aquí
    // para que no se guarde un BPM imposible (escrito o pegado a mano).
    const tempoNum = tempo.trim() ? parseInt(tempo, 10) : null;
    if (tempoNum !== null && (isNaN(tempoNum) || tempoNum < 40 || tempoNum > 300)) {
      showToast('El tempo debe estar entre 40 y 300 BPM', 'error');
      return;
    }

    const data = {
      titulo: titulo.trim(),
      autor: autor.trim() || null,
      tonalidad: tonalidad || null,
      tempo: tempoNum,
    };
    if (id && cancionExistente) {
      const updated = await updateCancion(id, data);
      if (updated) {
        showToast('Canción actualizada', 'success');
        navigate(`/cancion/${id}`);
      }
    } else {
      const created = await createCancion(data);
      if (created) {
        if (sesionId) {
          // Queda en el catálogo y, además, se agrega al final de la sesión.
          const sesion = await getSesion(sesionId);
          const orden = calcularSiguienteOrden(sesion?.canciones ?? []);
          await agregarCancion(sesionId, created.id, orden);
          showToast('Canción creada y agregada a la sesión', 'success');
          // Vamos al detalle de la canción para agregarle secciones; el botón de
          // volver de esa pantalla regresará a la sesión (lleva el ?sesion=).
          navigate(`/cancion/${created.id}?sesion=${sesionId}`);
        } else {
          showToast('Canción creada', 'success');
          navigate(`/cancion/${created.id}`);
        }
      }
    }
  };

  const esEdicion = !!cancionExistente;

  return (
    <div className="min-h-svh bg-gray-50 flex flex-col">
      <header className="sticky top-0 bg-white border-b border-gray-200 flex items-center gap-3 px-4 py-3 z-10">
        <button
          onClick={() => navigate(-1)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-xl"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">
          {esEdicion ? 'Editar Canción' : 'Nueva Canción'}
        </h1>
      </header>

      <div className="flex-1 p-4 flex flex-col gap-4 max-w-lg mx-auto w-full">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base"
            placeholder="Nombre de la canción"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
          <input
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base"
            placeholder="Nombre del autor"
            value={autor}
            onChange={e => setAutor(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tonalidad</label>
          <select
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base bg-white"
            value={tonalidad}
            onChange={e => setTonalidad(e.target.value)}
          >
            <option value="">Sin tonalidad</option>
            {TONALIDADES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tempo (BPM)</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base"
            placeholder="Ej: 120"
            value={tempo}
            onChange={e => setTempo(e.target.value)}
            min="40"
            max="300"
          />
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex flex-col gap-2"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <TouchButton variant="primary" fullWidth onClick={handleSubmit} disabled={loading || !titulo.trim()}>
          {loading ? 'Guardando...' : 'Guardar'}
        </TouchButton>
        <TouchButton variant="secondary" fullWidth onClick={() => navigate(-1)}>
          Cancelar
        </TouchButton>
      </div>
    </div>
  );
}
