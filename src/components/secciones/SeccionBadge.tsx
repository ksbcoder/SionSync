import { TIPOS_SECCION } from '../../domain';
import type { TipoSeccion } from '../../domain';

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
