import { TIPOS_SECCION } from '../../utils/constants';
import type { TipoSeccion } from '../../types';

export function SeccionBadge({ tipo }: { tipo: TipoSeccion }) {
  const { label, bg, text } = TIPOS_SECCION[tipo];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bg, color: text }}
    >
      {label}
    </span>
  );
}
