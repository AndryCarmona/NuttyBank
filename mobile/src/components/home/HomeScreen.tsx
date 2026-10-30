import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { fetchMe } from '@/lib/api';
import { NavigationIcon } from './NavigationIcon';
import { Button, Page, s, Summary, TransactionList } from './components';
import { colors as c, money, totalExpenses, transactions } from './data';

export default function HomeScreen() {
  const { session } = useAuth();
  // El nombre sale del perfil guardado en Supabase (a través del backend). Mientras llega, saludo genérico.
  const me = useQuery({ queryKey: ['me', session?.user.id], queryFn: fetchMe, enabled: !!session });
  const [period, setPeriod] = useState('Mensual');
  const items = transactions.filter(t => period === 'Mensual' || (period === 'Semanal' ? t.day >= 24 : t.day === 30));
  const percentage = Math.round(totalExpenses / (7783 + totalExpenses) * 100);
  return <Page green>
    <View style={styles.hero}>
      <View style={styles.greeting}><View><Text style={styles.welcome}>{me.data ? `Hola, ${me.data.username}` : 'Hola, bienvenid@'}</Text><Text style={s.small}>Buenos días</Text></View><NavigationIcon name="Notificaciones" /></View>
      {me.isError ? <Pressable accessibilityRole="button" onPress={() => me.refetch()} style={styles.profileError}><Text style={styles.profileErrorText}>No pudimos cargar tu perfil: {me.error.message} Toca para reintentar.</Text></Pressable> : null}
      <View style={styles.summaryPanel}>
        <View style={styles.balances}>
          <View style={styles.metric}><NavigationIcon name="Ingresos" /><Text style={s.small}>Saldo total</Text><Text numberOfLines={1} adjustsFontSizeToFit style={styles.balance}>{money(7783)}</Text></View>
          <View style={styles.rule} />
          <View style={styles.metric}><NavigationIcon name="Pagos" /><Text style={s.small}>Gasto total</Text><Text numberOfLines={1} adjustsFontSizeToFit style={styles.balance}>{money(-totalExpenses)}</Text></View>
        </View>
        <View style={styles.track}><View style={[styles.progress, { width: `${percentage}%` }]} /></View>
        <Text style={styles.caption}>{percentage}% de gastos sobre saldo disponible + gastos</Text>
      </View>
    </View>
    <View style={s.body}>
      <Summary onPress={() => router.push('/home/analysis')} />
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir calendario" onPress={() => router.push('/home/calendar')} style={({ pressed }) => [styles.calendar, pressed && styles.calendarPressed]}>
        <View style={styles.calendarIcon}><NavigationIcon name="Fecha" /></View>
        <View style={{ flex: 1 }}><Text style={styles.calendarLabel}>Calendario</Text><Text style={styles.calendarHint}>Consulta tus movimientos por fecha</Text></View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      <View style={styles.periods}>{['Diario', 'Semanal', 'Mensual'].map(p => <Button key={p} label={p} selected={p === period} onPress={() => setPeriod(p)} />)}</View>
      <TransactionList items={items} />
    </View>
  </Page>;
}
const styles = StyleSheet.create({
  profileError: { backgroundColor: '#FDE7E4', borderRadius: 14, padding: 12, marginBottom: 14 },
  profileErrorText: { fontSize: 12, color: '#912018', lineHeight: 17 },
  hero: { padding: 28, paddingTop: 30, paddingBottom: 24 },
  greeting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  welcome: { fontSize: 19, fontWeight: '700', color: c.ink },
  summaryPanel: { width: '100%', maxWidth: 400, alignSelf: 'center', padding: 16, borderRadius: 24, backgroundColor: '#FFFFFF24' },
  balances: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingVertical: 8 },
  metric: { flex: 1, minWidth: 0, alignItems: 'center', gap: 5 },
  balance: { fontSize: 22, fontWeight: '800', color: c.ink, marginTop: 6 },
  rule: { width: 1, backgroundColor: '#5E8163', marginVertical: 15 },
  track: { backgroundColor: '#F8FAF6', height: 10, borderRadius: 8, marginTop: 16, overflow: 'hidden' },
  progress: { height: '100%', backgroundColor: c.ink, borderRadius: 8 },
  caption: { fontSize: 10, color: c.ink, textAlign: 'center', marginTop: 9 },
  calendar: { backgroundColor: '#F0F3ED', borderWidth: 1, borderColor: '#DAE3D5', borderRadius: 22, padding: 14, marginTop: 18, flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 76 },
  calendarPressed: { backgroundColor: '#E3EBDD', opacity: .85 },
  calendarIcon: { backgroundColor: '#E0E9DA', borderRadius: 15 },
  calendarLabel: { fontSize: 15, fontWeight: '600', color: c.ink },
  calendarHint: { fontSize: 11, color: c.muted, marginTop: 4, lineHeight: 16 },
  chevron: { fontSize: 28, color: '#527A59', paddingHorizontal: 3 },
  periods: { flexDirection: 'row', gap: 10, backgroundColor: c.panel, padding: 7, borderRadius: 22, marginTop: 16 },
});
