import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, Check, X } from 'lucide-react';
import { useCanciones } from '../../hooks/useCanciones';
import { useSesiones } from '../../hooks/useSesiones';
import { useSecciones } from '../../hooks/useSecciones';
import { useToast } from '../../hooks/useToast';
import { TouchButton } from '../ui/TouchButton';
import { GenerarLetraSheet } from './GenerarLetraSheet';
import { TONALIDADES, calcularSiguienteOrden } from '../../domain';
import type { Cancion, SeccionGenerada } from '../../domain';

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
  const { addSecciones } = useSecciones();
  const { showToast } = useToast();

  const [titulo, setTitulo] = useState(cancionExistente?.titulo ?? '');
  const [autor, setAutor] = useState(cancionExistente?.autor ?? '');
  const [descripcion, setDescripcion] = useState(cancionExistente?.descripcion ?? '');
  const [tonalidad, setTonalidad] = useState(cancionExistente?.tonalidad ?? '');
  const [tempo, setTempo] = useState<string>(cancionExistente?.tempo?.toString() ?? '');

  // Secciones propuestas por la IA, listas para guardarse al crear la canción.
  const [iaOpen, setIaOpen] = useState(false);
  const [seccionesIA, setSeccionesIA] = useState<SeccionGenerada[] | null>(null);

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
      descripcion: descripcion.trim() || null,
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
        // Si la IA propuso secciones y el usuario las aplicó, se guardan ahora.
        if (seccionesIA?.length) {
          await addSecciones(
            seccionesIA.map((s, i) => ({ cancion_id: created.id, tipo: s.tipo, letra: s.letra, orden: i }))
          );
        }
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base leading-relaxed resize-none"
            rows={2}
            placeholder="Opcional. Se muestra en la lista cuando la canción no tiene autor."
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
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

        {!esEdicion && (
          seccionesIA?.length ? (
            <div className="flex items-center justify-between gap-2 bg-emerald-50 rounded-xl px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm text-emerald-800">
                <Check className="w-4 h-4 shrink-0" />
                {seccionesIA.length} {seccionesIA.length === 1 ? 'sección lista' : 'secciones listas'} para guardar
              </span>
              <button
                type="button"
                onClick={() => setSeccionesIA(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-emerald-700 hover:bg-emerald-100 rounded-lg"
                aria-label="Quitar secciones generadas"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { if (titulo.trim()) setIaOpen(true); }}
              disabled={!titulo.trim()}
              className="flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-brand-50 text-brand-800 font-medium text-sm hover:bg-brand-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              Generar letra con IA
            </button>
          )
        )}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-lg mx-auto w-full flex flex-col gap-2">
          <TouchButton variant="primary" fullWidth onClick={handleSubmit} disabled={loading || !titulo.trim()}>
            {loading ? 'Guardando...' : 'Guardar'}
          </TouchButton>
          <TouchButton variant="secondary" fullWidth onClick={() => navigate(-1)}>
            Cancelar
          </TouchButton>
        </div>
      </div>

      <GenerarLetraSheet
        isOpen={iaOpen}
        onClose={() => setIaOpen(false)}
        titulo={titulo.trim()}
        autor={autor.trim() || null}
        onAplicar={setSeccionesIA}
      />
    </div>
  );
}
