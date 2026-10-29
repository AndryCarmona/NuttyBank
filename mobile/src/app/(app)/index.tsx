import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { fetchMe } from '@/lib/api';
import { formatIsoDate } from '@/lib/validation';

export default function HomeScreen() {
  const { session, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // El id del usuario va en la clave: la caché de un usuario nunca se mezcla con la de otro.
  const me = useQuery({
    queryKey: ['me', session?.user.id],
    queryFn: fetchMe,
    enabled: !!session,
  });

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.five, paddingBottom: insets.bottom + BottomTabInset + Spacing.four },
        ]}>
        <View style={styles.content}>
          {me.isPending ? (
            <ActivityIndicator accessibilityLabel="Cargando tu perfil" color={theme.primary} />
          ) : me.isError ? (
            <View style={styles.block}>
              <ThemedText type="subtitle">No pudimos cargar tu perfil</ThemedText>
              <ThemedText themeColor="danger">{me.error.message}</ThemedText>
              <Button title="Reintentar" onPress={() => me.refetch()} loading={me.isFetching} />
            </View>
          ) : (
            <>
              <View style={styles.block}>
                <ThemedText type="subtitle">¡Hola, {me.data.username}!</ThemedText>
                <ThemedText themeColor="textSecondary">Tu sesión está activa.</ThemedText>
              </View>

              <View style={[styles.card, { backgroundColor: theme.brand }]}>
                <InfoRow label="Correo" value={me.data.email ?? '—'} />
                <InfoRow label="Teléfono" value={me.data.phone ?? '—'} />
                <InfoRow label="Nacimiento" value={formatIsoDate(me.data.birth_date)} />
              </View>
            </>
          )}

          <Button title="Cerrar Sesión" variant="secondary" onPress={signOut} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small">{label}</ThemedText>
      <ThemedText type="smallBold" style={styles.value}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  block: {
    gap: Spacing.two,
  },
  card: {
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  row: {
    gap: Spacing.half,
  },
  value: {
    fontSize: 16,
    lineHeight: 24,
  },
});
