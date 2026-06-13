import { describe, it, expect } from 'vitest';
import { calcularSiguienteOrden } from './seccion';

describe('calcularSiguienteOrden', () => {
  it('devuelve 0 cuando no hay secciones', () => {
    expect(calcularSiguienteOrden([])).toBe(0);
  });

  it('devuelve el siguiente número después del orden más alto', () => {
    expect(calcularSiguienteOrden([{ orden: 0 }, { orden: 1 }, { orden: 2 }])).toBe(3);
  });

  it('se basa en el máximo, no en la cantidad de elementos', () => {
    // Hay 2 secciones pero los órdenes tienen huecos; debe seguir al mayor (5)
    expect(calcularSiguienteOrden([{ orden: 5 }, { orden: 2 }])).toBe(6);
  });

  it('funciona aunque las secciones no estén ordenadas', () => {
    expect(calcularSiguienteOrden([{ orden: 3 }, { orden: 10 }, { orden: 1 }])).toBe(11);
  });

  it('maneja una sola sección', () => {
    expect(calcularSiguienteOrden([{ orden: 7 }])).toBe(8);
  });
});
