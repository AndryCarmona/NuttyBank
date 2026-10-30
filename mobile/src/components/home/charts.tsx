import { StyleSheet, Text, View } from 'react-native';
import { colors as c, money, transactions } from '@/components/home/data';
const palette = [c.green, c.bright, '#B5C6AB', '#384B40', '#C5DCD5'];
export function CategoryChart({ items = transactions }: { items?: typeof transactions }) {
  const expenses = items.filter(t => t.amount < 0);
  const total = expenses.reduce((sum, t) => sum - t.amount, 0);
  const groups = Array.from(new Set(expenses.map(t => t.category))).map((name, i) => ({ name, value: -expenses.filter(t => t.category === name).reduce((sum, t) => sum + t.amount, 0), color: palette[i % palette.length] }));
  if (!total) return <Text style={styles.empty}>No hay gastos para graficar en este período.</Text>;
  const segments = Array.from({ length: 120 }, (_, i) => {
    let boundary = 0;
    const group = groups.find(g => { boundary += g.value / total; return i / 120 < boundary; }) ?? groups[groups.length - 1];
    const angle = i * Math.PI * 2 / 120;
    return <View key={i} style={{ position: 'absolute', width: 6, height: 31, backgroundColor: group.color, left: 107 + Math.sin(angle) * 92, top: 94 - Math.cos(angle) * 92, transform: [{ rotate: `${i * 3}deg` }] }} />;
  });
  return <View accessibilityLabel={`Gastos por categoría. Total ${money(total)}`}><View style={styles.ring}>{segments}<View style={styles.ringLabel}><Text style={styles.caption}>Gasto total</Text><Text style={styles.total}>{money(total)}</Text></View></View><View style={{ gap: 13 }}>{groups.map(g => <View key={g.name} style={styles.legend}><View style={[styles.dot, { backgroundColor: g.color }]} /><Text style={{ flex: 1, color: c.ink, fontSize: 12 }}>{g.name}</Text><Text style={styles.caption}>{Math.round(g.value / total * 100)}%</Text><Text style={{ fontSize: 12, fontWeight: '600', color: c.ink }}>{money(g.value)}</Text></View>)}</View></View>;
}
export function WeeklyChart({ mode }: { mode: 'Gastos' | 'Ingresos' }) {
  const weeks = Array.from({ length: 5 }, (_, i) => transactions.filter(t => Math.floor((t.day - 1) / 7) === i && (mode === 'Gastos' ? t.amount < 0 : t.amount > 0)).reduce((sum, t) => sum + Math.abs(t.amount), 0));
  const max = mode === 'Gastos' ? 1000 : 4000;
  return <View accessibilityLabel={`${mode} por semana: ${weeks.map((v, i) => `Semana ${i + 1}: ${money(v)}`).join(', ')}`} style={styles.plot}><View style={styles.axis}>{[max, max * .75, max * .5, max * .25, 0].map(n => <Text key={n} style={styles.tick}>{n >= 1000 ? `${n / 1000}k` : n}</Text>)}</View><View style={styles.chart}><View style={styles.grid}>{[0, 1, 2, 3, 4].map(n => <View key={n} style={styles.gridLine} />)}</View>{weeks.map((value, i) => <View key={i} style={styles.column}><Text style={styles.barValue}>{value > 0 ? Math.round(value) : ''}</Text><View style={[styles.bar, { height: value / max * 138, backgroundColor: mode === 'Gastos' ? c.ink : c.green }]} /><Text style={styles.week}>S{i + 1}</Text></View>)}</View></View>;
}
const styles = StyleSheet.create({ ring: { width: 220, height: 220, alignSelf: 'center', marginVertical: 25 }, ringLabel: { position: 'absolute', top: 88, width: '100%', alignItems: 'center', gap: 5 }, total: { fontSize: 22, fontWeight: '700', color: c.ink }, caption: { fontSize: 11, color: c.muted }, legend: { flexDirection: 'row', alignItems: 'center', gap: 10 }, dot: { width: 10, height: 10, borderRadius: 5 }, empty: { padding: 30, textAlign: 'center', color: c.muted }, plot: { height: 200, flexDirection: 'row', marginTop: 26 }, axis: { width: 30, height: 153, justifyContent: 'space-between' }, tick: { fontSize: 10, color: c.muted }, chart: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', height: 175, paddingHorizontal: 4 }, grid: { position: 'absolute', top: 0, left: 0, right: 0, height: 153, justifyContent: 'space-between' }, gridLine: { borderTopWidth: 1, borderColor: '#CED8CF', borderStyle: 'dotted' }, column: { flex: 1, height: 175, justifyContent: 'flex-end', alignItems: 'center' }, bar: { width: 15, borderTopLeftRadius: 4, borderTopRightRadius: 4 }, barValue: { fontSize: 9, color: c.muted, paddingBottom: 4 }, week: { fontSize: 10, color: c.muted, marginTop: 8, height: 14 } });
