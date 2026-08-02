/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primarios — Indigo
        brand: {
          900: '#312e81', // texto principal
          700: '#4338ca', // botones CTA
          600: '#4f46e5', // CTA medio
          500: '#6366f1', // FAB, íconos activos
          400: '#818cf8', // acentos suaves
          300: '#a5b4fc', // bordes activos
          200: '#c7d2fe', // fondos seleccionados
          100: '#e0e7ff', // fondos suaves, botón secundario
        },
        // Semánticos
        success: '#059669',
        warning: '#f59e0b',
        danger:  '#dc2626',
        // Fondo general
        app: '#f8faff',
        // Acordes — Emerald
        chord: {
          dark:   '#059669', // edición
          light:  '#34d399', // presentación
          bg:     '#a7f3d0', // fondo chip
        },
        // Modo presentación — Slate
        stage: {
          bg:      '#1e293b',
          card:    '#334155',
          text:    '#e2e8f0',
          muted:   '#64748b',
        },
        // Secciones — pasteles
        section: {
          verso:     '#c7d2fe',
          coro:      '#fde68a',
          precoro:   '#fbcfe8',
          puente:    '#d9f99d',
          intro:     '#a7f3d0',
          outro:     '#fed7aa',
          final:     '#e9d5ff',
          otro:      '#f1f5f9',
        },
      },
      keyframes: {
        'slide-up': {
          '0%':   { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%':   { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        // Barrido de luz para los esqueletos de carga (efecto "shimmer").
        'shimmer': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        // Aparición suave de los tooltips (solo opacidad, no toca transform).
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'fade-in': 'fade-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
}
