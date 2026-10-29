import { Link, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInputInstance } from 'react-native';

import { AuthScreen } from '@/components/auth-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { ErrorNote } from '@/components/ui/error-note';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { validateEmail } from '@/lib/validation';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const passwordRef = useRef<TextInputInstance>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    setFormError(null);

    const emailProblem = validateEmail(email);
    const passwordProblem = password ? null : 'Escribe tu contraseña.';
    setEmailError(emailProblem);
    setPasswordError(passwordProblem);
    if (emailProblem || passwordProblem) return;

    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);

    // Si salió bien no hay que navegar: al cambiar la sesión, el layout raíz
    // cambia solo al grupo (app).
    if (!result.ok) setFormError(result.message);
  }

  return (
    <AuthScreen title="Bienvenido">
      <TextField
        label="Correo Electrónico"
        placeholder="tucorreo@ejemplo.com"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setEmailError(null);
        }}
        error={emailError}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        ref={passwordRef}
        label="Contraseña"
        placeholder="Tu contraseña"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setPasswordError(null);
        }}
        error={passwordError}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />

      {formError ? <ErrorNote>{formError}</ErrorNote> : null}

      <View style={styles.actions}>
        <Button title="Iniciar Sesión" onPress={handleSubmit} loading={submitting} />
        <Button title="Registrarse" onPress={() => router.push('/register')} />
      </View>

      <View style={styles.footer}>
        <ThemedText type="small">¿No Tienes Cuenta?</ThemedText>
        <Link href="/register">
          <ThemedText type="smallBold">Regístrate</ThemedText>
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
});
