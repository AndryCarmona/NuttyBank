// Almacenamiento de la sesión en la web: el localStorage del propio navegador.
// NO importar `expo-sqlite` aquí: su motor web necesita archivos .wasm y rompe el
// servidor de desarrollo ("Worker chunk not found").
//
// Al exportar la web, Expo pre-renderiza las páginas en Node, donde no existe
// `window`; ahí no hay almacenamiento y el cliente de Supabase no guarda sesión.
export const authStorage: Storage | undefined =
  typeof window === 'undefined' ? undefined : window.localStorage;
