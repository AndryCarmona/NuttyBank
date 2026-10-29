import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInputInstance } from 'react-native';

import { AuthScreen } from '@/components/auth-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { ErrorNote } from '@/components/ui/error-note';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  formatBirthDateInput,
  normalizePhone,
  parseBirthDate,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validatePhone,
  validateUsername,
} from '@/lib/validation';

type FieldName = 'username' | 'email' | 'phone' | 'birthDate' | 'password' | 'confirmation';
type FieldErrors = Partial<Record<FieldName, string | null>>;

export default function RegisterScreen() {
  const { signUp } = useAuth();

  const emailRef = useRef<TextInputInstance>(null);
  const phoneRef = useRef<TextInputInstance>(null);
  const birthRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmationRef = useRef<TextInputInstance>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function clearError(field: FieldName) {
    setErrors((current) => ({ ...current, [field]: null }));
  }

  async function handleSubmit() {
    if (submitting) return;
    setFormError(null);
    setNotice(null);

    const birth = parseBirthDate(birthDate);
    const nextErrors: FieldErrors = {
      username: validateUsername(username),
      email: validateEmail(email),
      phone: validatePhone(phone),
      birthDate: birth.error,
      password: validatePassword(password),
      confirmation: validatePasswordConfirmation(password, confirmation),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean) || birth.iso === null) return;

    setSubmitting(true);
    const result = await signUp({
      email,
      password,
      username,
      phone: normalizePhone(phone),
      birthDate: birth.iso,
    });
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    // Si el proyecto exige confirmar el correo no hay sesión todavía.
    // Si no lo exige, la sesión ya existe y el layout raíz cambia solo a (app).
    if (result.needsEmailConfirmation) {
      setNotice('Cuenta creada. Revisa tu correo para confirmarla y después inicia sesión.');
    }
  }

  return (
    <AuthScreen title="Crear Cuenta">
      <TextField
        label="Usuario"
        placeholder="nutty_01"
        value={username}
        onChangeText={(text) => {
          setUsername(text);
          clearError('username');
        }}
        error={errors.username}
        autoComplete="username-new"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <TextField
        ref={emailRef}
        label="Correo Electrónico"
        placeholder="tucorreo@ejemplo.com"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          clearError('email');
        }}
        error={errors.email}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => phoneRef.current?.focus()}
      />
      <TextField
        ref={phoneRef}
        label="Número De Móvil"
        placeholder="10 dígitos, ej. 2221234567"
        value={phone}
        onChangeText={(text) => {
          setPhone(text);
          clearError('phone');
        }}
        error={errors.phone}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        maxLength={14}
        returnKeyType="next"
        onSubmitEditing={() => birthRef.current?.focus()}
      />
      <TextField
        ref={birthRef}
        label="Fecha De Nacimiento"
        placeholder="DD/MM/AAAA"
        value={birthDate}
        onChangeText={(text) => {
          setBirthDate(formatBirthDateInput(text));
          clearError('birthDate');
        }}
        error={errors.birthDate}
        keyboardType="number-pad"
        maxLength={10}
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        ref={passwordRef}
        label="Contraseña"
        placeholder="Mínimo 8 caracteres"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          clearError('password');
        }}
        error={errors.password}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmationRef.current?.focus()}
      />
      <TextField
        ref={confirmationRef}
        label="Confirmar Contraseña"
        placeholder="Escríbela otra vez"
        value={confirmation}
        onChangeText={(text) => {
          setConfirmation(text);
          clearError('confirmation');
        }}
        error={errors.confirmation}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />

      {formError ? <ErrorNote>{formError}</ErrorNote> : null}
      {notice ? <ErrorNote style={styles.notice}>{notice}</ErrorNote> : null}

      <ThemedText type="small" style={styles.terms}>
        Al continuar, aceptas los términos de uso y la política de privacidad.
      </ThemedText>

      <Button title="Registrarse" onPress={handleSubmit} loading={submitting} />

      <View style={styles.footer}>
        <ThemedText type="small">¿Ya tienes cuenta?</ThemedText>
        <Link href="/login">
          <ThemedText type="smallBold">Inicia sesión</ThemedText>
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  notice: {
    backgroundColor: '#E8F3E9',
    color: '#1E4620',
  },
  terms: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one,
  },
});
