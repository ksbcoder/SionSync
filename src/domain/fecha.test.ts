import { describe, it, expect, afterEach, vi } from 'vitest';
import { toISODate, hoy, sumarDias, inicioSemana, formatFecha } from './fecha';

describe('toISODate', () => {
  it('formatea con ceros a la izquierda en mes y día', () => {
    // 5 de enero de 2025 (los meses en Date van de 0 a 11, así que 0 = enero)
    expect(toISODate(new Date(2025, 0, 5, 12, 0, 0))).toBe('2025-01-05');
  });

  it('mantiene los dos dígitos en fechas de fin de año', () => {
    expect(toISODate(new Date(2025, 11, 31, 12, 0, 0))).toBe('2025-12-31');
  });
});

describe('sumarDias', () => {
  it('suma días dentro del mismo mes', () => {
    expect(sumarDias('2025-06-10', 5)).toBe('2025-06-15');
  });

  it('resta días con número negativo', () => {
    expect(sumarDias('2025-06-10', -3)).toBe('2025-06-07');
  });

  it('cruza el límite de mes correctamente', () => {
    expect(sumarDias('2025-06-30', 1)).toBe('2025-07-01');
  });

  it('cruza el límite de año correctamente', () => {
    expect(sumarDias('2025-12-31', 1)).toBe('2026-01-01');
  });

  it('avanza una semana completa', () => {
    expect(sumarDias('2025-06-12', 7)).toBe('2025-06-19');
  });

  it('respeta los años bisiestos (2024 sí tiene 29 de febrero)', () => {
    expect(sumarDias('2024-02-28', 1)).toBe('2024-02-29');
  });

  it('en años no bisiestos salta directo a marzo', () => {
    expect(sumarDias('2025-02-28', 1)).toBe('2025-03-01');
  });
});

describe('inicioSemana', () => {
  it('un lunes devuelve ese mismo lunes', () => {
    // 2025-06-09 es lunes
    expect(inicioSemana('2025-06-09')).toBe('2025-06-09');
  });

  it('un miércoles devuelve el lunes anterior', () => {
    // 2025-06-11 es miércoles
    expect(inicioSemana('2025-06-11')).toBe('2025-06-09');
  });

  it('un domingo devuelve el lunes de esa misma semana, no el siguiente', () => {
    // 2025-06-15 es domingo; su semana empezó el lunes 2025-06-09
    expect(inicioSemana('2025-06-15')).toBe('2025-06-09');
  });

  it('un sábado devuelve el lunes anterior', () => {
    // 2025-06-14 es sábado
    expect(inicioSemana('2025-06-14')).toBe('2025-06-09');
  });
});

describe('hoy', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('devuelve la fecha actual en formato ISO', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 12, 9, 30, 0)); // 12 de junio de 2025
    expect(hoy()).toBe('2025-06-12');
  });
});

describe('formatFecha', () => {
  it('produce un texto corto en español sin lanzar errores', () => {
    const texto = formatFecha('2025-06-12');
    // El formato exacto depende del entorno; verificamos que sea un texto útil
    expect(typeof texto).toBe('string');
    expect(texto.length).toBeGreaterThan(0);
  });
});
