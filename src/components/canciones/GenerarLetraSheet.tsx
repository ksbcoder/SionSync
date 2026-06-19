import { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, Link2, AlertTriangle } from 'lucide-react';
import { useGenerarLetra } from '../../hooks/useGenerarLetra';
import { BottomSheet } from '../layout/BottomSheet';
import { TouchButton } from '../ui/TouchButton';
import { LetraLoader } from '../ui/LetraLoader';
import { SeccionBadge } from '../secciones/SeccionBadge';
import type { Fuente } from '../../infrastructure/ia.repository';
import type { SeccionGenerada } from '../../domain';

interface GenerarLetraSheetProps {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  autor: string | null;
  onAplicar: (secciones: SeccionGenerada[]) => void;
}

export function GenerarLetraSheet({ isOpen, onClose, titulo, autor, onAplicar }: GenerarLetraSheetProps) {
  const { loading, generarLetra } = useGenerarLetra();
  const [secciones, setSecciones] = useState<SeccionGenerada[] | null>(null);
  const [fuentes, setFuentes] = useState<Fuente[]>([]);
  const [noEncontrada, setNoEncontrada] = useState(false);

  const buscar = useCallback(async () => {
    setSecciones(null);
    setFuentes([]);
    setNoEncontrada(false);
    const res = await generarLetra(titulo, autor);
    if (!res) return; // el error ya se mostró como aviso
    if (!res.encontrada || res.secciones.length === 0) {
      setNoEncontrada(true);
      return;
    }
    setSecciones(res.secciones);
    setFuentes(res.fuentes ?? []);
  }, [generarLetra, titulo, autor]);

  // Al abrir la hoja se lanza la búsqueda; al cerrarla se limpia el resultado.
  useEffect(() => {
    if (isOpen) {
      buscar();
    } else {
      setSecciones(null);
      setFuentes([]);
      setNoEncontrada(false);
    }
  }, [isOpen, buscar]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Generar letra con IA">
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        {!loading && secciones && (
          <div className="flex items-start gap-2 bg-brand-50 border border-brand-100 rounded-xl p-3 shrink-0">
            <Sparkles className="w-4 h-4 text-brand-700 mt-0.5 shrink-0" />
            <p className="text-xs text-brand-900 leading-relaxed">
              La IA buscó la letra en internet. <strong>Revísala antes de aplicar</strong>: puede
              tener errores o faltar partes. Podrás editarla luego.
            </p>
          </div>
        )}

        {loading && <LetraLoader />}

        {!loading && noEncontrada && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-gray-500">
              No se encontró una letra confiable para esta canción. Revisa el título y el autor,
              o agrégala a mano.
            </p>
            <TouchButton variant="secondary" onClick={buscar}>
              <RefreshCw className="w-4 h-4 mr-2" /> Reintentar
            </TouchButton>
          </div>
        )}

        {!loading && secciones && (
          <>
            <p className="text-xs text-gray-400 shrink-0">
              {secciones.length} {secciones.length === 1 ? 'sección encontrada' : 'secciones encontradas'}
            </p>
            <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto">
              {secciones.map((s, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-3">
                  <SeccionBadge tipo={s.tipo} />
                  <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{s.letra}</p>
                </div>
              ))}
            </div>

            {fuentes.length > 0 ? (
              <div className="border-t border-gray-100 pt-3 shrink-0">
                <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
                  <Link2 className="w-3.5 h-3.5" /> Fuentes consultadas
                </p>
                <ul className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                  {fuentes.map((f, i) => (
                    <li key={i}>
                      <a
                        href={f.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-700 hover:underline break-words"
                      >
                        {f.titulo}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-start gap-2 border-t border-gray-100 pt-3 text-xs text-amber-700 shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <p>Esta letra la generó de su conocimiento, sin consultar fuentes externas. Revísala con más cuidado.</p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1 shrink-0">
              <TouchButton
                variant="primary"
                fullWidth
                onClick={() => { onAplicar(secciones); onClose(); }}
              >
                Usar estas secciones
              </TouchButton>
              <TouchButton variant="ghost" fullWidth onClick={buscar}>
                <RefreshCw className="w-4 h-4 mr-2" /> Buscar de nuevo
              </TouchButton>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
