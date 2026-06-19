// =====================================================================
// SionSync — Edge Function: generar-letra
// ---------------------------------------------------------------------
// Recibe el título y (opcional) el autor de una canción y le pide a la IA
// de Google (Gemini) que busque la letra en internet y la devuelva ya
// partida en secciones (intro, verso, coro, puente...). NO inventa acordes:
// solo letra y estructura.
//
// La llama la app desde el navegador, así que:
//   - Responde al "preflight" CORS (la pregunta previa del navegador).
//   - Exige que el usuario esté autenticado (token de sesión válido).
//   - La clave secreta de Gemini vive aquí en el servidor, nunca viaja al
//     navegador. Se configura con: supabase secrets set GEMINI_API_KEY=...
//
// Cuerpo JSON esperado:  { "titulo": "Cuán grande es Él", "autor": "..." }
// Respuesta:             { "encontrada": true, "secciones": [ { tipo, letra } ] }
// =====================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';

// Tipos de sección que la app entiende (deben coincidir con TipoSeccion del front).
const TIPOS_VALIDOS = ['verso', 'coro', 'pre-coro', 'puente', 'intro', 'outro', 'final', 'otro'] as const;
type TipoSeccion = (typeof TIPOS_VALIDOS)[number];

// El modelo a veces nombra distinto el mismo tipo; lo llevamos a los nuestros.
const SINONIMOS: Record<string, TipoSeccion> = {
  estrofa: 'verso',
  strophe: 'verso',
  verse: 'verso',
  chorus: 'coro',
  estribillo: 'coro',
  precoro: 'pre-coro',
  'pre coro': 'pre-coro',
  prechorus: 'pre-coro',
  bridge: 'puente',
  introduccion: 'intro',
  introducción: 'intro',
  intro: 'intro',
  outro: 'outro',
  cierre: 'final',
  final: 'final',
  coda: 'final',
};

function normalizarTipo(valor: unknown): TipoSeccion {
  const t = String(valor ?? '').trim().toLowerCase();
  if ((TIPOS_VALIDOS as readonly string[]).includes(t)) return t as TipoSeccion;
  return SINONIMOS[t] ?? 'otro';
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// Extrae el objeto JSON de la respuesta del modelo, aunque venga envuelto en
// texto o en un bloque ```json ... ```.
function extraerJSON(texto: string): unknown {
  const limpio = texto.replace(/```json/gi, '').replace(/```/g, '').trim();
  const ini = limpio.indexOf('{');
  const fin = limpio.lastIndexOf('}');
  if (ini === -1 || fin === -1) throw new Error('La IA no devolvió un formato válido.');
  return JSON.parse(limpio.slice(ini, fin + 1));
}

const MODELO = 'gemini-2.5-flash';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);

  // 1) Verificar que quien llama tiene sesión válida.
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader) return json({ error: 'No autorizado.' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: 'Sesión inválida o expirada.' }, 401);

  // 2) Leer entrada.
  let body: { titulo?: string; autor?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Cuerpo de la petición inválido.' }, 400);
  }
  const titulo = (body.titulo ?? '').trim();
  const autor = (body.autor ?? '').trim();
  if (!titulo) return json({ error: 'Falta el título de la canción.' }, 400);

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ error: 'Falta configurar GEMINI_API_KEY en el servidor.' }, 500);

  // 3) Construir la instrucción para la IA.
  const referencia = autor ? `"${titulo}" de ${autor}` : `"${titulo}"`;
  const prompt = `Eres un asistente para músicos de iglesia. Busca en internet la letra completa
de la canción cristiana ${referencia} y devuélvela partida en sus secciones.

Reglas sobre el contenido:
- Usa la letra REAL de la canción. No la inventes ni la completes con suposiciones.
- Si no logras encontrarla con confianza, responde {"encontrada": false, "secciones": []}.
- No incluyas acordes ni notas musicales, solo la letra.

Reglas sobre las fuentes (muy importante):
- USA SIEMPRE la herramienta de Búsqueda de Google para localizar y verificar la letra en
  internet, AUNQUE creas conocerla de memoria. No respondas de memoria sin verificar.
- Prioriza fuentes confiables y reconocidas: el sitio oficial del autor o ministerio,
  el canal/descripción oficial en YouTube, y plataformas grandes de letras con buena reputación.
- Contrasta la letra entre VARIAS fuentes y quédate con la versión en la que coincidan.
- Evita foros, blogs personales, comentarios de usuarios y páginas poco conocidas o de baja
  reputación; si solo aparece en sitios así, trátalo como "no encontrada".
- Ante versiones distintas, prefiere la del autor/ministerio oficial.

Reglas de segmentación (síguelas SIEMPRE igual para que el resultado sea consistente):
- Cada sección tiene un "tipo" (uno de: intro, verso, pre-coro, coro, puente, outro, final, otro)
  y una "letra" (el texto, con saltos de línea \\n entre renglones).
- Una "estrofa" (bloque de versos separado por una línea en blanco en la letra original) =
  EXACTAMENTE una sección. No juntes dos estrofas en una sola sección ni partas una estrofa en dos.
- El coro va completo en su propia sección. Cada vez que el coro se repite en la canción,
  inclúyelo de nuevo como una sección "coro" separada, en el orden real.
- Respeta el orden real de principio a fin. No reordenes ni resumas.
- Usa "intro"/"outro" solo si la letra original los marca explícitamente.

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, con esta forma exacta:
{"encontrada": true, "secciones": [{"tipo": "verso", "letra": "línea 1\\nlínea 2"}]}`;

  // 4) Llamar a Gemini con búsqueda en Google activada (grounding).
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent?key=${apiKey}`;
  let respGemini: Response;
  try {
    respGemini = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        // Temperatura 0 = la IA elige siempre la opción más probable, sin azar,
        // para que el mismo título devuelva prácticamente el mismo resultado.
        generationConfig: { temperature: 0 },
      }),
    });
  } catch {
    return json({ error: 'No se pudo contactar con el servicio de IA.' }, 502);
  }

  if (!respGemini.ok) {
    const detalle = await respGemini.text().catch(() => '');
    console.error('Gemini error', respGemini.status, detalle);
    if (respGemini.status === 429) {
      // "limit: 0" = el modelo no está habilitado para esta clave (Pro sin
      // facturación en el proyecto de la clave), no es un límite por uso.
      if (/limit:\s*0/i.test(detalle)) {
        return json({
          error: `El modelo "${MODELO}" no está habilitado para tu clave de API. ` +
            'Suele pasar cuando la clave pertenece a un proyecto de Google sin facturación activa.',
        }, 429);
      }
      return json({ error: 'Se alcanzó el límite de uso de la IA. Intenta más tarde.' }, 429);
    }
    return json({ error: 'La IA no pudo procesar la solicitud.' }, 502);
  }

  // 5) Extraer el texto generado y convertirlo a nuestras secciones.
  const data = await respGemini.json();
  const candidato = data?.candidates?.[0];
  const texto: string =
    candidato?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';

  // Fuentes REALES que la búsqueda de Google consultó (no las inventa el modelo).
  // Vienen en groundingMetadata; según la versión, en groundingChunks o en
  // groundingAttributions. Tomamos ambos y quitamos repetidas.
  type Chunk = { web?: { uri?: string; title?: string } };
  const meta = candidato?.groundingMetadata ?? {};
  const chunks = [
    ...((meta.groundingChunks ?? []) as Chunk[]),
    ...((meta.groundingAttributions ?? []) as Chunk[]),
  ];
  const dominio = (uri: string): string => {
    try { return new URL(uri).hostname.replace(/^www\./, ''); } catch { return uri; }
  };
  const fuentes = chunks
    .map((c) => ({ titulo: c.web?.title || (c.web?.uri ? dominio(c.web.uri) : ''), uri: c.web?.uri ?? '' }))
    .filter((f) => f.uri)
    .filter((f, i, arr) => arr.findIndex((x) => x.uri === f.uri) === i);

  let parsed: { encontrada?: boolean; secciones?: { tipo?: unknown; letra?: unknown }[] };
  try {
    parsed = extraerJSON(texto) as typeof parsed;
  } catch {
    return json({ error: 'La IA devolvió una respuesta que no se pudo leer. Intenta de nuevo.' }, 502);
  }

  const secciones = (parsed.secciones ?? [])
    .map((s) => ({ tipo: normalizarTipo(s.tipo), letra: String(s.letra ?? '').trim() }))
    .filter((s) => s.letra.length > 0);

  if (parsed.encontrada === false || secciones.length === 0) {
    return json({ encontrada: false, secciones: [], fuentes: [] });
  }

  return json({ encontrada: true, secciones, fuentes });
});
