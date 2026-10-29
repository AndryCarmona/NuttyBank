// Almacenamiento de la sesión en celular (iOS y Android).
// `expo-sqlite/localStorage/install` crea el `localStorage` global respaldado por
// SQLite, que es lo que recomienda la guía oficial de Expo para Supabase.
// La versión web de este archivo es `supabase-storage.web.ts`: Metro la elige sola
// para web, así el motor de SQLite nunca entra al paquete web.
import 'expo-sqlite/localStorage/install';

export const authStorage: Storage | undefined = localStorage;
