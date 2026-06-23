import { useState } from 'react';
import { TouchButton } from '../ui/TouchButton';
import { TIPOS_SECCION } from '../../domain';
import type { TipoSeccion, Seccion } from '../../domain';

interface SeccionFormProps {
  seccion?: Seccion;
  onGuardar: (data: { tipo: TipoSeccion; letra: string; descripcion: string | null }) => Promise<void>;
  onCancelar: () => void;
}

export function SeccionForm({ seccion, onGuardar, onCancelar }: SeccionFormProps) {
  const [tipo, setTipo] = useState<TipoSeccion>(seccion?.tipo ?? 'verso');
  const [letra, setLetra] = useState(seccion?.letra ?? '');
  const [descripcion, setDescripcion] = useState(seccion?.descripcion ?? '');
  const [saving, setSaving] = useState(false);

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
          className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base leading-relaxed resize-none"
          rows={6}
          placeholder="Escribe la letra aquí..."
          value={letra}
          onChange={e => setLetra(e.target.value)}
          style={{ minHeight: '150px' }}
        />
      </div>
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
