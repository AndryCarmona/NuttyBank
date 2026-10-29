// Cliente de Supabase para la app.
//
// Sesión persistente: al cerrar y abrir la app, el usuario sigue con su sesión
// iniciada. Dónde se guarda depende de la plataforma (ver supabase-storage.ts y
// supabase-storage.web.ts).
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { authStorage } from '@/lib/supabase-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copia mobile/.env.example a mobile/.env, complétalo y reinicia con: npx expo start -c',
  );
}

// Al exportar la versión web, Expo pre-renderiza las páginas en Node, donde no
// existe `window` ni localStorage. Ahí el cliente no guarda ni renueva sesión.
const isServer = typeof window === 'undefined';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    persistSession: !isServer,
    autoRefreshToken: !isServer,
    // En celular no hay URL de la que leer una sesión.
    detectSessionInUrl: false,
  },
});

// Renovar el token solo mientras la app está abierta y visible.
if (!isServer) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
