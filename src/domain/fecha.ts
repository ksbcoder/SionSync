// Utilidades de fecha en formato ISO (YYYY-MM-DD), sin horas ni zonas.
//
// Trabajamos siempre con la fecha "calendario" (el día tal como lo ve el
// usuario), no con instantes en el tiempo. Por eso al convertir un texto
// "YYYY-MM-DD" a Date le añadimos la hora del mediodía ('T12:00:00'): así
// evitamos que un cambio de zona horaria empuje la fecha al día anterior o
// siguiente.

const HORA_SEGURA = 'T12:00:00';

/** Convierte un objeto Date a texto "YYYY-MM-DD". */
export function toISODate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** La fecha de hoy en formato "YYYY-MM-DD". */
export function hoy(): string {
  return toISODate(new Date());
}

/** Suma (o resta, con número negativo) días a una fecha "YYYY-MM-DD". */
export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(fecha + HORA_SEGURA);
  d.setDate(d.getDate() + dias);
  return toISODate(d);
}

/**
 * Devuelve el lunes de la semana a la que pertenece la fecha dada.
 * La semana empieza en lunes (estándar en Colombia/Europa), no en domingo.
 */
export function inicioSemana(fecha: string): string {
  const d = new Date(fecha + HORA_SEGURA);
  const dow = d.getDay(); // 0 = domingo, 1 = lunes, ... 6 = sábado
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return toISODate(d);
}

/** Texto corto y legible de una fecha, p. ej. "lun, 9 jun". */
export function formatFecha(fecha: string): string {
  const d = new Date(fecha + HORA_SEGURA);
  return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
}
