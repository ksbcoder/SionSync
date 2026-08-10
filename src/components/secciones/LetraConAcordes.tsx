import { parseLetra } from '../../domain';

interface LetraConAcordesProps {
  /** Letra en formato ChordPro: los acordes van entre corchetes, p. ej. "[Am]Me rin[C]do". */
  letra: string;
  /** Estilo grande para el modo presentación (fondo oscuro). */
  presentacion?: boolean;
}

/**
 * Pinta la letra con cada acorde justo encima de la sílaba donde suena. El
 * acorde se coloca flotando sobre el inicio de su trozo de texto, de modo que
 * la letra sigue fluyendo y partiéndose por palabras con normalidad. Las líneas
 * sin acordes se ven como texto corriente.
 */
export function LetraConAcordes({ letra, presentacion = false }: LetraConAcordesProps) {
  const lineas = parseLetra(letra);
  const textoClase = presentacion
    ? 'text-xl leading-loose text-stage-text'
    : 'text-lg leading-relaxed text-gray-800';
  const acordeClase = presentacion
    ? 'text-chord-light'
    : 'text-chord-dark';

  return (
    <div className={`whitespace-pre-wrap ${textoClase}`}>
      {lineas.map((segmentos, i) => {
        const tieneAcorde = segmentos.some(s => s.acorde);
        // El renglón reserva un poco de alto arriba solo si lleva acordes, para
        // que la etiqueta flotante no choque con la línea anterior.
        return (
          <div key={i} className={tieneAcorde ? 'pt-6' : undefined}>
            {segmentos.map((seg, j) => (
              <span key={j} className="relative">
                {seg.acorde && (
                  <span
                    className={`absolute -top-5 left-0 font-mono text-sm font-semibold whitespace-pre ${acordeClase}`}
                  >
                    {seg.acorde}
                  </span>
                )}
                {seg.texto}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}
