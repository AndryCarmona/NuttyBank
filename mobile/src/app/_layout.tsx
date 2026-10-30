import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, Stack, ThemeProvider, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { screenBackground } from '@/components/home/ScreenSurface';
import { colors } from '@/components/home/data';
import { ThemedView } from '@/components/themed-view';
import { Poppins } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/auth-context';

SplashScreen.preventAutoHideAsync();
// Pinta también el contenedor nativo, antes de que se monte la navegación.
void SystemUI.setBackgroundColorAsync(colors.green).catch(error => console.warn('No se pudo aplicar el fondo nativo.', error));

export default function RootLayout() {
  const pathname = usePathname();
  const backgroundColor = screenBackground(pathname);
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(backgroundColor).catch(error => console.warn('No se pudo actualizar el fondo nativo.', error));
  }, [backgroundColor]);
  const navigationTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: backgroundColor } };
  // Un solo QueryClient por montaje de la app (consulta y caché de datos del backend).
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1 } } }));

  return (
    <View style={[styles.fill, { backgroundColor }]}>
      <KeyboardProvider statusBarTranslucent preserveEdgeToEdge>
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
    </View>
  );
}

function RootNavigator() {
  const pathname = usePathname();
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
    <Stack screenOptions={{ headerShown: false, statusBarStyle: 'dark', statusBarTranslucent: true, contentStyle: { backgroundColor: screenBackground(pathname) } }}>
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
