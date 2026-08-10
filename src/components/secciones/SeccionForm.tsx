import { useState, useRef } from 'react';
import { Plus, Check, X, RotateCcw } from 'lucide-react';
import { TouchButton } from '../ui/TouchButton';
import { LetraConAcordes } from './LetraConAcordes';
import { TIPOS_SECCION, extraerAcordes, reemplazarAcordes, tieneAcordes } from '../../domain';
import type { TipoSeccion, Seccion } from '../../domain';

interface SeccionFormProps {
  seccion?: Seccion;
  onGuardar: (data: { tipo: TipoSeccion; letra: string; descripcion: string | null }) => Promise<void>;
  onCancelar: () => void;
}

/**
 * Pone en mayúscula la primera letra del acorde y la que sigue a un separador,
 * conservando el resto (así la 'm' de menor queda en minúscula: 'am' → 'Am',
 * 'c/g' → 'C/G').
 */
function capitalizarAcorde(texto: string): string {
  return texto.replace(/(^|[\s\-—–,/])([a-z])/g, (_, sep, letra) => sep + letra.toUpperCase());
}

export function SeccionForm({ seccion, onGuardar, onCancelar }: SeccionFormProps) {
  const [tipo, setTipo] = useState<TipoSeccion>(seccion?.tipo ?? 'verso');
  const [letra, setLetra] = useState(seccion?.letra ?? '');
  const [descripcion, setDescripcion] = useState(seccion?.descripcion ?? '');
  const [saving, setSaving] = useState(false);

  // Modo "insertar acorde": recordamos dónde estaba el cursor en la letra para
  // meter el acorde justo ahí (puede caer a mitad de una palabra).
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPos, setCursorPos] = useState(0);
  const [insertando, setInsertando] = useState(false);
  const [acordeNuevo, setAcordeNuevo] = useState('');

  // Cambio rápido: la fila de acordes actuales, editable de una sola vez.
  const acordesActuales = extraerAcordes(letra);
  const [secuencia, setSecuencia] = useState(() => extraerAcordes(seccion?.letra ?? '').join(' '));

  const recordarCursor = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setCursorPos(e.currentTarget.selectionStart ?? 0);
  };

  const confirmarInsertar = () => {
    const simbolo = capitalizarAcorde(acordeNuevo.trim());
    if (!simbolo) { setInsertando(false); return; }
    const pos = Math.min(cursorPos, letra.length);
    const nueva = letra.slice(0, pos) + `[${simbolo}]` + letra.slice(pos);
    setLetra(nueva);
    setInsertando(false);
    setAcordeNuevo('');
    const nuevoCursor = pos + simbolo.length + 2; // detrás del acorde recién puesto
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (ta) { ta.focus(); ta.setSelectionRange(nuevoCursor, nuevoCursor); setCursorPos(nuevoCursor); }
    });
  };

  const aplicarCambioRapido = () => {
    const nuevos = secuencia.trim().split(/\s+/).filter(Boolean).map(capitalizarAcorde);
    const nueva = reemplazarAcordes(letra, nuevos);
    setLetra(nueva);
    setSecuencia(extraerAcordes(nueva).join(' '));
  };

  const handleSubmit = async () => {
    if (!letra.trim()) return;
    setSaving(true);
    await onGuardar({ tipo, letra: letra.trim(), descripcion: descripcion.trim() || null });
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de sección</label>
        <select
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base bg-white"
          value={tipo}
          onChange={e => setTipo(e.target.value as TipoSeccion)}
        >
          {Object.entries(TIPOS_SECCION).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Letra</label>
        <textarea
          ref={textareaRef}
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base leading-relaxed resize-none font-mono"
          rows={6}
          placeholder="Escribe la letra aquí..."
          value={letra}
          onChange={e => setLetra(e.target.value)}
          onSelect={recordarCursor}
          onClick={recordarCursor}
          onKeyUp={recordarCursor}
          style={{ minHeight: '150px' }}
        />

        {insertando ? (
          <div className="flex gap-2 items-center mt-2">
            <input
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base font-mono focus:outline-none focus:border-chord-dark"
              placeholder="Ej: Am"
              value={acordeNuevo}
              onChange={e => setAcordeNuevo(capitalizarAcorde(e.target.value))}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); confirmarInsertar(); }
                else if (e.key === 'Escape') { setInsertando(false); setAcordeNuevo(''); }
              }}
              autoFocus
            />
            <button onClick={confirmarInsertar} className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-green-600 hover:bg-green-50">
              <Check className="w-5 h-5" />
            </button>
            <button onClick={() => { setInsertando(false); setAcordeNuevo(''); }} className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50">
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setInsertando(true)}
            className="mt-2 inline-flex items-center gap-1.5 min-h-[40px] px-3 text-sm font-medium text-chord-dark bg-chord-bg/60 border border-emerald-100 rounded-lg hover:bg-chord-bg"
          >
            <Plus className="w-4 h-4" />
            Acorde en el cursor
          </button>
        )}
        <p className="mt-1.5 text-xs text-gray-400">
          Pon el cursor donde suene el acorde (puede ser a mitad de palabra) y pulsa «Acorde en el cursor».
        </p>
      </div>

      {tieneAcordes(letra) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vista previa</label>
          <div className="border border-gray-200 rounded-xl px-3 pt-2 pb-3 bg-gray-50">
            <LetraConAcordes letra={letra} />
          </div>
        </div>
      )}

      {acordesActuales.length > 0 && (
        <div className="border border-gray-200 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Cambiar todos los acordes</span>
            <button
              onClick={() => setSecuencia(acordesActuales.join(' '))}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
              title="Traer los acordes actuales"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Usar actuales
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {acordesActuales.map((a, i) => (
              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-sm font-medium bg-chord-bg/50 text-chord-dark">
                {a}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base font-mono focus:outline-none focus:border-chord-dark"
              placeholder="Ej: Do Re Mi Fa"
              value={secuencia}
              onChange={e => setSecuencia(capitalizarAcorde(e.target.value))}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); aplicarCambioRapido(); } }}
            />
            <button
              onClick={aplicarCambioRapido}
              className="min-h-[44px] px-4 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Aplicar
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Reemplaza los acordes en orden, sin moverlos de sitio. Escribe la nueva lista separada por espacios.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base leading-relaxed resize-none"
          rows={2}
          placeholder="Opcional. Aparece como una nota al final de la sección."
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <TouchButton variant="primary" fullWidth onClick={handleSubmit} disabled={saving || !letra.trim()}>
          {saving ? 'Guardando...' : 'Guardar'}
        </TouchButton>
        <TouchButton variant="secondary" fullWidth onClick={onCancelar}>
          Cancelar
        </TouchButton>
      </div>
    </div>
  );
}
