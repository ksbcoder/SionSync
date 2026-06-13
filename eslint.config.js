import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Reglas del React Compiler (incluidas en react-hooks v7). Este proyecto
      // NO usa el React Compiler, y estas reglas marcan como error patrones
      // legítimos y deliberados: el patrón "latest ref" (guardar el último
      // callback en una ref), la recursión del auto-scroll vía
      // requestAnimationFrame, y los setState de inicialización/reseteo dentro
      // de un efecto. Las dejamos desactivadas mientras no se adopte el
      // compilador; las reglas clásicas (rules-of-hooks, exhaustive-deps)
      // siguen activas.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
    },
  },
])
