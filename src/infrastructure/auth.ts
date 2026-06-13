import { supabase } from './supabase';

/**
 * Devuelve el ID del usuario autenticado o lanza un error si no hay sesión.
 * Lo usan los repositorios al crear registros que deben quedar asociados a
 * quien los crea (canciones, programaciones, etc.).
 */
export async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');
  return user.id;
}
