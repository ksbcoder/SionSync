import { useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../infrastructure/supabase';
import { AuthContext } from './useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    }).catch(() => {
      setSession(null);
      setUser(null);
    }).finally(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setSession(session);
      // Mantener la misma referencia si el usuario no cambió, para no disparar
      // re-renders en useEffect que dependen de `user` (p.ej. useRoles).
      setUser(prev => (prev?.id === nextUser?.id ? prev : nextUser));

      // La sincronización de nombre solo tiene sentido al iniciar sesión.
      // IMPORTANTE: debe ir en setTimeout. Supabase mantiene un candado interno
      // mientras corre este callback; llamar a supabase aquí dentro provoca un
      // bloqueo mutuo que deja colgadas todas las peticiones de la app.
      if (session?.user && _event === 'SIGNED_IN') {
        const userId = session.user.id;
        const nombreActual = session.user.user_metadata?.full_name;
        setTimeout(async () => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', userId)
              .single();

            if (profile && profile.display_name !== nombreActual) {
              const { data } = await supabase.auth.updateUser({ data: { full_name: profile.display_name } });
              if (data.user) setUser(data.user);
            }
          } catch {
            // La sincronización de nombre no es crítica
          }
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error('EMAIL_EXISTS');
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithEmail, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
