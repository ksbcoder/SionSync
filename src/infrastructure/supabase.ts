import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// Al bloquear el móvil o minimizar el navegador, el sistema congela la página
// y las peticiones en camino pueden quedar "zombis": nunca responden ni fallan.
// Como el refresco del token espera detrás de ellas, toda la app queda colgada.
// El timeout garantiza que ninguna petición espere para siempre.
const TIMEOUT_MS = 15000;

function conTimeout(externo?: AbortSignal | null): AbortSignal {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  return externo ? AbortSignal.any([externo, timeout]) : timeout;
}

const fetchConTimeout: typeof fetch = async (input, init) => {
  const externo = init?.signal;
  try {
    return await fetch(input, { ...init, signal: conTimeout(externo) });
  } catch (e) {
    // Solo reintentar si la canceló nuestro timeout, no quien hizo la llamada.
    if (e instanceof DOMException && e.name === 'TimeoutError' && !externo?.aborted) {
      return fetch(input, { ...init, signal: conTimeout(externo) });
    }
    throw e;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchConTimeout },
});

// Renovar la sesión apenas la app vuelve a primer plano, en vez de esperar a
// que el usuario toque algo; en segundo plano se pausan las renovaciones.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
