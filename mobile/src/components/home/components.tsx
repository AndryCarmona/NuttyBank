import { KeyboardAwareScrollView, useKeyboardState } from 'react-native-keyboard-controller';
import RaisedTab from '@/components/home/RaisedTab';
import { PropsWithChildren } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as c, money, transactions } from '@/components/home/data';
import { NavigationIcon } from '@/components/home/NavigationIcon';

export function Button({ label, onPress, selected = false }: { label: string; onPress: () => void; selected?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [s.pill, selected && s.selected, pressed && { opacity: .65 }]}><Text style={[s.small, selected && { color: 'white' }]}>{label}</Text></Pressable>;
}
export function Page({ children, title, green = false }: PropsWithChildren<{ title?: string; green?: boolean }>) {
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardState(state => state.isVisible);
  return <SafeAreaView edges={['top', 'left', 'right']} style={[s.safe, green && { backgroundColor: c.green }]}><View style={s.frame}><KeyboardAwareScrollView style={s.scroll} contentContainerStyle={[s.scrollContent, green && { backgroundColor: c.green }]} bottomOffset={24} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
    {title && <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Volver al inicio" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={s.touch}><Text style={{ fontSize: 27, color: c.ink }}>←</Text></Pressable><Text style={s.title}>{title}</Text><View style={s.touch}><NavigationIcon name="Notificaciones" /></View></View>}
    {children}</KeyboardAwareScrollView><View pointerEvents={keyboardVisible ? "none" : "auto"} accessibilityElementsHidden={keyboardVisible} importantForAccessibility={keyboardVisible ? "no-hide-descendants" : "auto"} style={keyboardVisible ? s.hiddenNavigation : undefined}><Navigation /><View style={{ height: insets.bottom, backgroundColor: c.panel }} /></View></View></SafeAreaView>;
}
export function Navigation() {
  const path = usePathname();
  const items = ['Inicio', 'Calendario', 'Asistente', 'Movimientos', 'Resumen'];
  return <View style={s.nav}>{items.map((label, i) => {
    const active = (i === 0 && path === '/') || (i === 3 && path.startsWith('/cards'));
    const disabled = i !== 0 && i !== 3;
    return <Pressable key={label} accessibilityRole="button" accessibilityLabel={i === 3 ? 'Tarjetas' : label} disabled={disabled} accessibilityState={{ selected: active, disabled }} onPress={() => { router.navigate(i === 3 ? '/cards' : '/'); }} style={({ pressed }) => [s.navItem, i === 2 && s.mascotButton, pressed && { opacity: .75 }]}>{i === 2 ? <Image source={require('@/assets/images/nutty-mascot.png')} style={s.mascot} resizeMode="contain" /> : <RaisedTab active={active}><View style={[s.tabSurface, active && s.tabSelected]}><NavigationIcon name={label} /></View><View style={[s.tabDot, { opacity: active ? 1 : 0 }]} /></RaisedTab>}</Pressable>;
  })}</View>;
}
export function Summary({ onPress }: { onPress?: () => void }) {
  const content = <><Text accessibilityRole="header" style={s.summaryTitle}>Análisis rápido</Text><View style={s.summaryContent}><View style={s.savings}><Text style={{ fontSize: 37 }}>🐷</Text><Text style={s.small}>Ahorros</Text></View><View style={s.summaryRight}><View style={s.summaryLine}><View style={s.summaryIcon}><NavigationIcon name="Ingresos" size={23} /></View><View style={{ flex: 1 }}><Text style={s.small}>Ingresos sem.</Text><Text style={s.bold}>{money(4000)}</Text></View></View><View style={s.divider} /><View style={s.summaryLine}><View style={s.summaryIcon}><NavigationIcon name="Comida" size={23} /></View><View style={{ flex: 1 }}><Text style={s.small}>Comida semanal</Text><Text style={s.bold}>{money(-100)}</Text></View></View></View></View></>;
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel="Ver análisis de ahorros, ingresos y egresos" onPress={onPress} style={({ pressed }) => [s.summary, pressed && { opacity: .7 }]}>{content}</Pressable> : <View style={s.summary}>{content}</View>;
}
export function TransactionList({ items = transactions, month = 'Abr', empty = 'No hay movimientos en esta fecha.' }: { items?: typeof transactions; month?: string; empty?: string }) {
  return <View style={{ gap: 19, paddingVertical: 18 }}>{items.length === 0 && <Text style={s.empty}>{empty}</Text>}{items.map(t => <View key={t.id} style={s.transaction}><View style={[s.transactionIcon, { backgroundColor: t.color }]}><NavigationIcon name={t.category} /></View><View style={{ flex: 1 }}><Text style={s.transactionName}>{t.name}</Text><Text style={s.detail}>{t.time} · {t.day} {month}</Text></View><Text style={s.category}>{t.category}</Text><Text style={s.amount}>{money(t.amount)}</Text></View>)}</View>;
}
export const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: c.paper },
  scrollContent: { flexGrow: 1 },
  hiddenNavigation: { position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: c.ink },
  summaryContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryIcon: { backgroundColor: '#DEE9D8', borderRadius: 13 },
  tabSurface: { borderRadius: 20, padding: 3, borderWidth: 2, borderColor: 'transparent' },
  tabSelected: { backgroundColor: c.green, borderColor: c.paper, elevation: 4, shadowColor: '#314B35', shadowOffset: { width: 0, height: 3 }, shadowOpacity: .18, shadowRadius: 5 },
  tabDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#527A59', marginTop: 5 },
  safe: { flex: 1, backgroundColor: c.paper }, frame: { flex: 1, width: '100%', maxWidth: 540, alignSelf: 'center', backgroundColor: c.paper },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 54 }, title: { fontSize: 17, fontWeight: '700', color: c.ink }, touch: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  body: { backgroundColor: c.paper, borderTopLeftRadius: 48, borderTopRightRadius: 48, padding: 24, paddingBottom: 38, flexGrow: 1 },
  small: { fontSize: 12, color: c.ink }, bold: { fontSize: 17, fontWeight: '700', color: c.ink },
  summary: { borderRadius: 28, backgroundColor: c.panel, padding: 23, gap: 18, minHeight: 146 }, savings: { flex: 1, alignItems: 'center', gap: 8, borderRightWidth: 1, borderRightColor: '#B9C4BC', paddingRight: 10 }, summaryRight: { flex: 1.6, gap: 10 }, divider: { height: 1, backgroundColor: '#D5DADD' },
  pill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.green, paddingHorizontal: 10, paddingVertical: 11, borderRadius: 19, minHeight: 42 }, selected: { backgroundColor: c.ink },
  nav: { flexDirection: 'row', backgroundColor: c.panel, borderTopLeftRadius: 38, borderTopRightRadius: 38, paddingHorizontal: 13, paddingTop: 10, paddingBottom: 8, alignItems: 'center', minHeight: 76 }, navItem: { flex: 1, height: 48, justifyContent: 'center', alignItems: 'center' }, navIcon: { fontSize: 32, color: c.ink }, activeIcon: { backgroundColor: c.green, borderRadius: 16, overflow: 'hidden', paddingHorizontal: 8 }, mascotButton: { overflow: 'hidden', borderRadius: 40, backgroundColor: c.green, height: 65, maxWidth: 65, marginTop: -30, borderWidth: 5, borderColor: c.paper }, mascot: { width: 155, height: 100, position: 'absolute', top: -8, left: -56 },
  transaction: { flexDirection: 'row', alignItems: 'center', gap: 10 }, transactionIcon: { width: 45, height: 45, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, transactionName: { fontSize: 12, fontWeight: '600', color: c.ink }, detail: { fontSize: 10, color: c.muted, marginTop: 6 }, category: { fontSize: 10, color: c.muted, borderLeftWidth: 1, borderLeftColor: '#B9C4BC', paddingLeft: 9, maxWidth: 72 }, amount: { fontSize: 12, fontWeight: '600', color: c.ink, minWidth: 72, textAlign: 'right' }, empty: { textAlign: 'center', color: c.muted, paddingVertical: 24, lineHeight: 22 },
});



