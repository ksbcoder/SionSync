import { describe, it, expect } from 'vitest';
import { parseLinea, parseLetra, tieneAcordes, extraerAcordes, reemplazarAcordes } from './chordpro';

describe('parseLinea', () => {
  it('separa acorde y texto en trozos', () => {
    expect(parseLinea('[Am]Me rin[C]do')).toEqual([
      { acorde: 'Am', texto: 'Me rin' },
      { acorde: 'C', texto: 'do' },
    ]);
  });

  it('el texto antes del primer acorde sale sin acorde', () => {
    expect(parseLinea('Me rin[C]do')).toEqual([
      { acorde: null, texto: 'Me rin' },
      { acorde: 'C', texto: 'do' },
    ]);
  });

  it('una línea sin acordes es un solo trozo de texto', () => {
    expect(parseLinea('Me rindo')).toEqual([{ acorde: null, texto: 'Me rindo' }]);
  });

  it('un acorde al final sin texto conserva el acorde', () => {
    expect(parseLinea('[Am]')).toEqual([{ acorde: 'Am', texto: '' }]);
  });

  it('dos acordes seguidos generan un trozo vacío entre ellos', () => {
    expect(parseLinea('[Am][C]Hola')).toEqual([
      { acorde: 'Am', texto: '' },
      { acorde: 'C', texto: 'Hola' },
    ]);
  });

  it('una línea vacía devuelve un trozo vacío (conserva el renglón)', () => {
    expect(parseLinea('')).toEqual([{ acorde: null, texto: '' }]);
  });
});

describe('parseLetra', () => {
  it('trocea cada línea por separado', () => {
    expect(parseLetra('[Am]uno\n[C]dos')).toEqual([
      [{ acorde: 'Am', texto: 'uno' }],
      [{ acorde: 'C', texto: 'dos' }],
    ]);
  });

  it('conserva los renglones en blanco', () => {
    const r = parseLetra('uno\n\ndos');
    expect(r).toHaveLength(3);
    expect(r[1]).toEqual([{ acorde: null, texto: '' }]);
  });
});

describe('tieneAcordes', () => {
  it('detecta cuando hay acordes', () => {
    expect(tieneAcordes('[Am]Me rindo')).toBe(true);
  });

  it('es falso cuando no hay acordes', () => {
    expect(tieneAcordes('Me rindo')).toBe(false);
  });
});

describe('extraerAcordes', () => {
  it('lista los acordes en orden de aparición', () => {
    expect(extraerAcordes('[La]Me [Sol]rin[Fa]do [Si]ya')).toEqual(['La', 'Sol', 'Fa', 'Si']);
  });

  it('devuelve lista vacía si no hay acordes', () => {
    expect(extraerAcordes('Me rindo')).toEqual([]);
  });
});

describe('reemplazarAcordes', () => {
  it('reemplaza uno a uno manteniendo las posiciones', () => {
    expect(reemplazarAcordes('[La]Me [Sol]rin[Fa]do [Si]ya', ['Do', 'Re', 'Mi', 'Fa']))
      .toBe('[Do]Me [Re]rin[Mi]do [Fa]ya');
  });

  it('si hay menos acordes nuevos, elimina los que sobran', () => {
    expect(reemplazarAcordes('[La]a[Sol]b[Fa]c', ['Do'])).toBe('[Do]abc');
  });

  it('un acorde nuevo vacío elimina el acorde de esa posición', () => {
    expect(reemplazarAcordes('[La]a[Sol]b', ['', 'Re'])).toBe('a[Re]b');
  });

  it('si hay más acordes nuevos, los sobrantes van sueltos al final', () => {
    expect(reemplazarAcordes('[La]a', ['Do', 'Re', 'Mi'])).toBe('[Do]a\n[Re][Mi]');
  });

  it('sin acordes previos y con nuevos, los agrega al final', () => {
    expect(reemplazarAcordes('Me rindo', ['Do', 'Re'])).toBe('Me rindo\n[Do][Re]');
  });
});
