import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { Poppins, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  /** primary: relleno gris pizarra (como el mockup). secondary: solo borde. */
  variant?: 'primary' | 'secondary';
  /** Muestra un indicador de carga y bloquea nuevos toques. */
  loading?: boolean;
};

export function Button({ title, variant = 'primary', loading = false, disabled, ...rest }: ButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const inactive = disabled || loading;
  const contentColor = isPrimary ? '#FFFFFF' : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? { backgroundColor: theme.primary } : { borderWidth: 2, borderColor: theme.primary },
        (pressed || inactive) && styles.dimmed,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <Text style={[styles.title, { color: contentColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 999,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Poppins.semibold,
    fontSize: 16,
    lineHeight: 24,
  },
  dimmed: {
    opacity: 0.6,
  },
});
