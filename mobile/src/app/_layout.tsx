import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemedView } from '@/components/themed-view';
import { Colors, Poppins } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/auth-context';

SplashScreen.preventAutoHideAsync();

// Tema de navegación con el fondo crema de NuttyBank (evita un destello blanco al cambiar de pantalla).
const navigationTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Colors.light.background },
};

export default function RootLayout() {
  // Un solo QueryClient por montaje de la app (consulta y caché de datos del backend).
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1 } } }));

  return (
    <KeyboardProvider>
      <ThemeProvider value={navigationTheme}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="dark" />
            <AnimatedSplashOverlay />
            <RootNavigator />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </KeyboardProvider>
  );
}

function RootNavigator() {
  const { session, loading } = useAuth();
  const [fontsLoaded, fontError] = useFonts({
    [Poppins.regular]: Poppins_400Regular,
    [Poppins.medium]: Poppins_500Medium,
    [Poppins.semibold]: Poppins_600SemiBold,
    [Poppins.bold]: Poppins_700Bold,
  });

  // Mientras se revisa si quedó una sesión guardada (y se cargan las fuentes) no se
  // muestra ninguna pantalla: evita ver el login un instante a quien ya había iniciado
  // sesión. Si las fuentes fallan, se sigue con la fuente del sistema.
  if (loading || (!fontsLoaded && !fontError)) return <ThemedView style={styles.fill} />;

  // Con sesión solo existe el grupo (app); sin sesión, solo el grupo (auth).
  // Expo Router redirige solo cuando la sesión cambia (iniciar o cerrar sesión).
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session} redirectTo="/login">
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session} redirectTo="/">
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
