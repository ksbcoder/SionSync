// Los acordes viven incrustados en la propia letra, justo antes de la sílaba
// donde suenan, con el formato estándar ChordPro: el acorde entre corchetes.
//
//     [Am]Me rin[C]do
//
// El [Am] suena en la "M" de "Me"; el [C] suena entre la "n" y la "d" de
// "rindo". Como el acorde va pegado a su posición dentro del texto, nunca se
// desalinea aunque se edite la letra.
//
// Este módulo solo entiende el formato (leerlo y transformarlo). Pintarlo en
// pantalla es trabajo de los componentes.

/** Un trozo de una línea: el acorde que arranca aquí (o ninguno) y el texto
 *  que va debajo de él hasta el siguiente acorde. */
export interface SegmentoAcorde {
  /** Símbolo del acorde (p. ej. "Am") o null si este trozo no lleva acorde. */
  acorde: string | null;
  /** Texto de la letra que va bajo este acorde. Puede ser cadena vacía. */
  texto: string;
}

const RE_ACORDE = /\[([^\]]*)\]/g;

/**
 * Parte una línea en trozos para pintarla en dos filas (acorde arriba, letra
 * abajo). El texto anterior al primer acorde sale como un trozo sin acorde.
 * Una línea vacía devuelve un único trozo vacío (así se conservan los renglones
 * en blanco entre versos).
 *
 *   parseLinea("[Am]Me rin[C]do")
 *   → [ { acorde: "Am", texto: "Me rin" }, { acorde: "C", texto: "do" } ]
 */
export function parseLinea(linea: string): SegmentoAcorde[] {
  const segmentos: SegmentoAcorde[] = [];
  const regex = new RegExp(RE_ACORDE);
  let cursor = 0;
  let acordeActual: string | null = null;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(linea)) !== null) {
    const texto = linea.slice(cursor, match.index);
    // El texto que quedó atrás pertenece al acorde que veníamos arrastrando.
    if (acordeActual !== null || texto.length > 0) {
      segmentos.push({ acorde: acordeActual, texto });
    }
    acordeActual = match[1];
    cursor = match.index + match[0].length;
  }

  const restante = linea.slice(cursor);
  if (acordeActual !== null || restante.length > 0 || segmentos.length === 0) {
    segmentos.push({ acorde: acordeActual, texto: restante });
  }
  return segmentos;
}

/** Parte la letra completa en líneas ya troceadas, lista para pintar. */
export function parseLetra(letra: string): SegmentoAcorde[][] {
  return letra.split('\n').map(parseLinea);
}

/** ¿La letra trae al menos un acorde incrustado? */
export function tieneAcordes(letra: string): boolean {
  return new RegExp(RE_ACORDE).test(letra);
}

/**
 * Lista los símbolos de acorde en el orden en que aparecen en la letra.
 * Sirve para el "cambio rápido": mostrar de un vistazo qué acordes hay.
 *
 *   extraerAcordes("[La]Me [Sol]rin[Fa]do [Si]ya")  →  ["La", "Sol", "Fa", "Si"]
 */
export function extraerAcordes(letra: string): string[] {
  const acordes: string[] = [];
  const regex = new RegExp(RE_ACORDE);
  let match: RegExpExecArray | null;
  while ((match = regex.exec(letra)) !== null) {
    acordes.push(match[1]);
  }
  return acordes;
}

/**
 * Cambio rápido de acordes: reemplaza los acordes existentes por 'nuevos',
 * uno a uno y en el mismo orden, SIN mover posiciones. Pensado para cuando ya
 * se sabe cuántos acordes tiene la sección y solo se quieren cambiar los
 * símbolos (La·Sol·Fa·Si → Do·Re·Mi·Fa) sin ir uno por uno.
 *
 * - Mismo número de acordes: cada uno se reemplaza en su sitio.
 * - Menos acordes nuevos: los que sobran se eliminan (queda solo la letra).
 * - Más acordes nuevos: los que sobran, que no tienen posición conocida, se
 *   añaden sueltos en un renglón nuevo al final para no perderlos.
 * - Un acorde nuevo vacío ("") elimina el acorde de esa posición.
 */
export function reemplazarAcordes(letra: string, nuevos: string[]): string {
  let indice = 0;
  const resultado = letra.replace(RE_ACORDE, () => {
    const nuevo = indice < nuevos.length ? nuevos[indice] : null;
    indice += 1;
    return nuevo != null && nuevo !== '' ? `[${nuevo}]` : '';
  });

  // 'indice' terminó valiendo cuántos acordes había en la letra original.
  if (nuevos.length > indice) {
    const extra = nuevos
      .slice(indice)
      .filter(a => a !== '')
      .map(a => `[${a}]`)
      .join('');
    if (extra) return resultado.replace(/\s*$/, '') + '\n' + extra;
  }
  return resultado;
}
