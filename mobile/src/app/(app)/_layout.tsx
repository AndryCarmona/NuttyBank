import { Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';

import { setStorageUser } from '@/components/cards/store';
import { useAuth } from '@/context/auth-context';
import { screenBackground } from '@/components/home/ScreenSurface';

// Pantallas para usuarios con sesión iniciada (el grupo está protegido en el layout raíz).
// La navegación inferior la dibuja cada pantalla (components/home/components.tsx).
export default function AppLayout() {
  const pathname = usePathname();
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  // Los datos de tarjetas y movimientos se guardan en el teléfono por usuario:
  // al cambiar de cuenta se cargan los de esa cuenta y se descartan los anteriores.
  useEffect(() => {
    setStorageUser(userId);
    return () => setStorageUser(null);
  }, [userId]);

  return <Stack screenOptions={{ headerShown: false, statusBarStyle: 'dark', statusBarTranslucent: true, contentStyle: { backgroundColor: screenBackground(pathname) } }} />;
}
