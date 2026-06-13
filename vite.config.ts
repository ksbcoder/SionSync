import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Separamos las librerías grandes y estables (React, Supabase) en su
        // propio archivo. Como casi nunca cambian, el navegador puede
        // reutilizarlas de la caché entre despliegues y solo descargar de
        // nuevo el código de la app.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/](react|react-dom|react-router|react-router-dom)[\\/]/.test(id)) {
              return 'react-vendor';
            }
            if (id.includes('@supabase')) return 'supabase-vendor';
          }
        },
      },
    },
  },
})
