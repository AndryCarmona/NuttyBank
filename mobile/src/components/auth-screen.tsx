import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AuthScreenProps = {
  title: string;
  children: ReactNode;
};

/**
 * Marco de las pantallas de iniciar sesión y registrarse, según el mockup:
 * título sobre fondo crema y formulario en un panel verde de esquinas redondeadas.
 *
 * KeyboardAwareScrollView (react-native-keyboard-controller) sube el campo que se
 * está escribiendo para que el teclado no lo tape. Requiere <KeyboardProvider> en
 * el layout raíz.
 */
export function AuthScreen({ title, children }: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <ThemedView style={styles.root}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.five }]}>
          <ThemedText type="subtitle" style={styles.title} accessibilityRole="header">
            {title}
          </ThemedText>
        </View>

        <View style={[styles.panel, { backgroundColor: theme.brand, paddingBottom: insets.bottom + Spacing.four }]}>
          <View style={styles.form}>{children}</View>
        </View>
      </KeyboardAwareScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  header: {
    paddingBottom: Spacing.five,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  panel: {
    flexGrow: 1,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: Spacing.five,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 440,
    gap: Spacing.three,
  },
});
