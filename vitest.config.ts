import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // La lógica que probamos (fechas, cálculos) es pura y no toca el DOM,
    // así que 'node' basta y es más rápido que un entorno de navegador.
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**/*.ts'],
    },
  },
});
