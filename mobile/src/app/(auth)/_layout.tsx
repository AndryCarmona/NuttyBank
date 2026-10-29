import { Stack } from 'expo-router';

// Pantallas para quien aún no inicia sesión. La primera (login) es la que se abre por defecto.
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
