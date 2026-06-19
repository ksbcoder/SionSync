import { supabase } from './supabase';
import type { SeccionGenerada } from '../domain';

export interface Fuente {
  titulo: string;
  uri: string;
}

export interface ResultadoGeneracion {
  encontrada: boolean;
  secciones: SeccionGenerada[];
  fuentes: Fuente[];
}

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generar-letra`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// Buscar en internet + estructurar la letra tarda más que una consulta normal.
// Por eso esta llamada usa su propio tiempo de espera amplio, en vez del cliente
// de Supabase (que corta a los 15s y haría fallar generaciones largas).
const TIMEOUT_MS = 60000;

export const iaRepository = {
  async generarLetra(titulo: string, autor: string | null): Promise<ResultadoGeneracion> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');

    let resp: Response;
    try {
      resp = await fetch(FUNCTIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: ANON_KEY,
        },
        body: JSON.stringify({ titulo, autor: autor ?? '' }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'TimeoutError') {
        throw new Error('La IA tardó demasiado en responder. Intenta de nuevo.', { cause: e });
      }
      throw new Error('No se pudo conectar con el servicio de IA.', { cause: e });
    }

    const cuerpo = await resp.json().catch(() => null);
    if (!resp.ok) {
      throw new Error(cuerpo?.error ?? 'No se pudo generar la letra.');
    }
    return cuerpo ?? { encontrada: false, secciones: [], fuentes: [] };
  },
};
