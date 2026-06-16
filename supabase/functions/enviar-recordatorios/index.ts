// =====================================================================
// SionSync — Edge Function: enviar-recordatorios
// ---------------------------------------------------------------------
// Busca los responsables de una fecha objetivo (por defecto, mañana) que
// aún no han sido avisados, y les envía una notificación Push a todos sus
// dispositivos. Marca 'notificado = true' para no repetir.
//
// La invoca el cron diario, pero también puede llamarse a mano para probar
// a cualquier hora. Acepta un cuerpo JSON opcional:
//   { "dias_antes": 1 }            -> fecha objetivo = hoy + 1 (mañana)
//   { "fecha": "2026-06-21" }      -> una fecha exacta
//   { "forzar": true }             -> reenvía aunque ya estuvieran avisados
// =====================================================================

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const ZONA = 'America/Bogota';

// "Hoy" según la hora de Colombia, en formato YYYY-MM-DD.
function hoyEnZona(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date());
}

function sumarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

function fechaLegible(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: ZONA,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${iso}T12:00:00Z`));
}

// Formas en que Supabase puede devolver el tipo de programación anidado:
// como objeto único o, según la versión, dentro de un arreglo.
type TipoProgramacion = { nombre?: string };
type Programacion = { tipos_programacion?: TipoProgramacion | TipoProgramacion[] };
type ResponsableConTipo = { programaciones?: Programacion | Programacion[] };

// El nombre del tipo puede llegar como objeto anidado o, según la versión,
// dentro de un arreglo. Normalizamos ambos casos.
function nombreDelTipo(responsable: ResponsableConTipo): string {
  const prog = Array.isArray(responsable.programaciones)
    ? responsable.programaciones[0]
    : responsable.programaciones;
  const tipo = Array.isArray(prog?.tipos_programacion)
    ? prog?.tipos_programacion[0]
    : prog?.tipos_programacion;
  return tipo?.nombre ?? 'una programación';
}

Deno.serve(async (req) => {
  let body: { fecha?: string; dias_antes?: number; forzar?: boolean };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const forzar = body.forzar === true;
  const objetivo = body.fecha ?? sumarDias(hoyEnZona(), body.dias_antes ?? 1);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:baquerochavarro@gmail.com',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  );

  // Responsables de la fecha objetivo (con el nombre de su tipo de programación).
  let query = supabase
    .from('responsables_programacion')
    .select('id, user_id, fecha, notificado, programaciones(tipos_programacion(nombre))')
    .eq('fecha', objetivo);
  if (!forzar) query = query.eq('notificado', false);

  const { data: responsables, error } = await query;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const legible = fechaLegible(objetivo);
  let enviados = 0;
  let sinDispositivo = 0;
  const avisados: string[] = [];

  for (const r of responsables ?? []) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', r.user_id);

    if (!subs || subs.length === 0) {
      sinDispositivo++;
      continue;
    }

    const payload = JSON.stringify({
      title: 'Recordatorio',
      body: `Te toca ${nombreDelTipo(r)} — ${legible}`,
      url: '/',
      tag: `resp-${r.id}`,
    });

    let algunoLlego = false;
    for (const s of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        enviados++;
        algunoLlego = true;
      } catch (err) {
        // 404/410 = la suscripción caducó: la borramos para no reintentar.
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        }
      }
    }

    if (algunoLlego) {
      avisados.push(r.id);
      if (!forzar) {
        await supabase
          .from('responsables_programacion')
          .update({ notificado: true })
          .eq('id', r.id);
      }
    }
  }

  return new Response(
    JSON.stringify({
      objetivo,
      responsables: responsables?.length ?? 0,
      enviados,
      sin_dispositivo: sinDispositivo,
      avisados: avisados.length,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
