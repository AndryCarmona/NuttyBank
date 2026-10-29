import { useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { authErrorMessage } from '@/lib/auth-errors';
import { supabase } from '@/lib/supabase';

export type AuthResult =
  | { ok: true; needsEmailConfirmation?: boolean }
  | { ok: false; message: string };

export type SignUpData = {
  email: string;
  password: string;
  username: string;
  phone: string;
  /** Formato AAAA-MM-DD */
  birthDate: string;
};

type AuthContextValue = {
  /** Sesión actual, o null si no ha iniciado sesión. */
  session: Session | null;
  /** true mientras se revisa si quedó una sesión guardada al abrir la app. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (data: SignUpData) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Supabase avisa aquí de todo: sesión restaurada al abrir (INITIAL_SESSION),
    // inicio de sesión, cierre y renovación del token.
    // OJO: dentro de este callback no se debe llamar a otros métodos de supabase.auth.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setLoading(false);
      // Al cerrar sesión se borra la caché: el siguiente usuario no debe ver datos del anterior.
      if (event === 'SIGNED_OUT') queryClient.clear();
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const signIn = useCallback<AuthContextValue['signIn']>(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { ok: false, message: authErrorMessage(error) };
    return { ok: true };
  }, []);

  const signUp = useCallback<AuthContextValue['signUp']>(async (data) => {
    const { data: result, error } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      // Estos nombres los lee el trigger `handle_new_user` de la base de datos
      // para crear la fila de `profiles`. Si se cambian, hay que cambiar el trigger.
      options: {
        data: {
          username: data.username.trim(),
          phone: data.phone,
          birth_date: data.birthDate,
        },
      },
    });
    if (error) return { ok: false, message: authErrorMessage(error) };
    // Sin sesión = el proyecto exige confirmar el correo antes de entrar.
    if (!result.session) return { ok: true, needsEmailConfirmation: true };
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ session, loading, signIn, signUp, signOut }),
    [session, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}
