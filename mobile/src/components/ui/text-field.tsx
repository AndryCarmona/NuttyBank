import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ErrorNote } from '@/components/ui/error-note';
import { Poppins, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  label: string;
  /** Mensaje de error; si existe, el campo se marca en rojo. */
  error?: string | null;
};

/** Campo de texto tipo píldora con etiqueta y error. Si es de contraseña, incluye el ojo para mostrarla. */
export const TextField = forwardRef<TextInputInstance, TextFieldProps>(function TextField(
  { label, error, secureTextEntry, style, ...rest },
  ref,
) {
  const theme = useTheme();
  const [hidden, setHidden] = useState(true);
  const isPassword = secureTextEntry === true;

  return (
    <View style={styles.container}>
      <ThemedText type="small" style={styles.label}>
        {label}
      </ThemedText>
      <View
        style={[
          styles.inputBox,
          { backgroundColor: theme.backgroundElement, borderColor: error ? theme.danger : 'transparent' },
        ]}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor="#8A9099"
          style={[styles.input, { color: theme.text }, style]}
          secureTextEntry={isPassword && hidden}
          autoCapitalize="none"
          autoCorrect={false}
          {...rest}
        />
        {isPassword && (
          <Pressable
            onPress={() => setHidden((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            hitSlop={10}>
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={22} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>
      {error ? <ErrorNote>{error}</ErrorNote> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    marginLeft: Spacing.two,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    minHeight: 46,
    fontFamily: Poppins.regular,
    fontSize: 14,
    // Quita el borde azul que el navegador dibuja al enfocar (web); ya hay borde propio.
    outlineStyle: 'none',
  } as object,
});
