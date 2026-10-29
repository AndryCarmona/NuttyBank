import { PropsWithChildren } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as c, money, transactions } from './data';
import { NavigationIcon } from './NavigationIcon';

export function Button({ label, onPress, selected = false }: { label: string; onPress: () => void; selected?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [s.pill, selected && s.selected, pressed && { opacity: .65 }]}><Text style={[s.small, selected && { color: 'white' }]}>{label}</Text></Pressable>;
}
export function Page({ children, title, green = false }: PropsWithChildren<{ title?: string; green?: boolean }>) {
  const insets = useSafeAreaInsets();
  return <SafeAreaView edges={['top', 'left', 'right']} style={[s.safe, green && { backgroundColor: c.green }]}><View style={s.frame}><ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
    {title && <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Volver al inicio" onPress={() => router.canGoBack() ? router.back() : router.replace('/home')} style={s.touch}><Text style={{ fontSize: 27, color: c.ink }}>←</Text></Pressable><Text style={s.title}>{title}</Text><View style={s.touch}><NavigationIcon name="Notificaciones" /></View></View>}
    {children}</ScrollView><Navigation /><View style={{ height: insets.bottom, backgroundColor: c.panel }} /></View></SafeAreaView>;
}
export function Navigation() {
  const path = usePathname();
  const items = [{ icon: '⌂', label: 'Inicio', route: '/home' }, { icon: '▤', label: 'Calendario', route: '/home/calendar' }, { icon: '', label: 'Análisis rápido', route: '/home/analysis' }, { icon: '▱', label: 'Movimientos', route: '/home/analysis' }, { icon: '♙', label: 'Resumen', route: '/home/analysis' }] as const;
  return <View style={s.nav}>{items.map((item, i) => <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} disabled={i !== 0} accessibilityState={{ selected: i === 0 && (path === "/home" || path === "/"), disabled: i !== 0 }} onPress={() => router.navigate("/home")} style={[s.navItem, i === 2 && s.mascotButton]}>{i === 2 ? <Image source={require('@/assets/images/nutty-mascot.png')} style={s.mascot} resizeMode="contain" /> : <NavigationIcon name={item.label} active={i === 0 ? path === item.route || path === '/' : false} />}</Pressable>)}</View>;
}
export function Summary({ onPress }: { onPress?: () => void }) {
  const content = <><View style={s.savings}><Text style={{ fontSize: 37 }}>🐷</Text><Text style={s.small}>Ahorros</Text></View><View style={s.summaryRight}><View><Text style={s.small}>▱  Ingresos sem.</Text><Text style={s.bold}>{money(4000)}</Text></View><View style={s.divider} /><View><Text style={s.small}>♜  Comida semanal</Text><Text style={s.bold}>{money(-100)}</Text></View></View></>;
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel="Ver análisis de ahorros, ingresos y egresos" onPress={onPress} style={({ pressed }) => [s.summary, pressed && { opacity: .7 }]}>{content}</Pressable> : <View style={s.summary}>{content}</View>;
}
export function TransactionList({ items = transactions, month = 'Abr', empty = 'No hay movimientos en esta fecha.' }: { items?: typeof transactions; month?: string; empty?: string }) {
  return <View style={{ gap: 19, paddingVertical: 18 }}>{items.length === 0 && <Text style={s.empty}>{empty}</Text>}{items.map(t => <View key={t.id} style={s.transaction}><View style={[s.transactionIcon, { backgroundColor: t.color }]}><NavigationIcon name={t.category} /></View><View style={{ flex: 1 }}><Text style={s.transactionName}>{t.name}</Text><Text style={s.detail}>{t.time} · {t.day} {month}</Text></View><Text style={s.category}>{t.category}</Text><Text style={s.amount}>{money(t.amount)}</Text></View>)}</View>;
}
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.paper }, frame: { flex: 1, width: '100%', maxWidth: 540, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 54 }, title: { fontSize: 17, fontWeight: '700', color: c.ink }, touch: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  body: { backgroundColor: c.paper, borderTopLeftRadius: 48, borderTopRightRadius: 48, padding: 28, minHeight: 480 },
  small: { fontSize: 12, color: c.ink }, bold: { fontSize: 17, fontWeight: '700', color: c.ink },
  summary: { borderRadius: 28, backgroundColor: c.panel, padding: 23, flexDirection: 'row', alignItems: 'center', gap: 23, minHeight: 146 }, savings: { flex: 1, alignItems: 'center', gap: 8, borderRightWidth: 1, borderRightColor: '#B9C4BC', paddingRight: 18 }, summaryRight: { flex: 1.6, gap: 10 }, divider: { height: 1, backgroundColor: '#D5DADD' },
  pill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.green, paddingHorizontal: 10, paddingVertical: 11, borderRadius: 19, minHeight: 42 }, selected: { backgroundColor: c.ink },
  nav: { flexDirection: 'row', backgroundColor: c.panel, borderTopLeftRadius: 38, borderTopRightRadius: 38, paddingHorizontal: 13, paddingTop: 10, paddingBottom: 8, alignItems: 'center', minHeight: 76 }, navItem: { flex: 1, height: 48, justifyContent: 'center', alignItems: 'center' }, navIcon: { fontSize: 32, color: c.ink }, activeIcon: { backgroundColor: c.green, borderRadius: 16, overflow: 'hidden', paddingHorizontal: 8 }, mascotButton: { overflow: 'hidden', borderRadius: 40, backgroundColor: c.green, height: 65, maxWidth: 65, marginTop: -30, borderWidth: 5, borderColor: c.paper }, mascot: { width: 155, height: 100, position: 'absolute', top: -8, left: -56 },
  transaction: { flexDirection: 'row', alignItems: 'center', gap: 10 }, transactionIcon: { width: 45, height: 45, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, transactionName: { fontSize: 12, fontWeight: '600', color: c.ink }, detail: { fontSize: 10, color: c.muted, marginTop: 6 }, category: { fontSize: 10, color: c.muted, borderLeftWidth: 1, borderLeftColor: '#B9C4BC', paddingLeft: 9, maxWidth: 72 }, amount: { fontSize: 12, fontWeight: '600', color: c.ink, minWidth: 72, textAlign: 'right' }, empty: { textAlign: 'center', color: c.muted, paddingVertical: 24, lineHeight: 22 },
});
