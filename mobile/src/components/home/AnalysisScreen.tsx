import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Page, s, Summary, TransactionList } from '@/components/home/components';
import { CategoryChart, WeeklyChart } from '@/components/home/charts';
import { colors as c, money, transactions } from '@/components/home/data';
export default function AnalysisScreen() {
  const [mode, setMode] = useState<'Gastos' | 'Ingresos'>('Gastos');
  const items = transactions.filter(t => mode === 'Gastos' ? t.amount < 0 : t.amount > 0);
  const total = items.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  return <Page title="Análisis rápido"><View style={styles.body}><Summary /><View style={styles.chartCard}><View style={styles.heading}><View><Text style={s.title}>{mode} de abril</Text><Text style={styles.sub}>Tu mes, de un vistazo</Text></View><Text style={s.bold}>{money(total)}</Text></View><View style={styles.tabs}>{(['Gastos', 'Ingresos'] as const).map(t => <Button key={t} label={t} selected={mode === t} onPress={() => setMode(t)} />)}</View><WeeklyChart mode={mode} /><View style={styles.legend}><View style={styles.dot} /><Text style={s.small}>{mode} por semana · Abril 2023</Text></View></View>{mode === 'Gastos' && <View style={styles.breakdown}><Text style={s.title}>¿En qué estás gastando?</Text><CategoryChart items={items} /></View>}<View style={styles.heading}><Text style={s.title}>Movimientos</Text><Text style={styles.sub}>{items.length} registros</Text></View><TransactionList items={items} /></View></Page>;
}
const styles = StyleSheet.create({ body: { flexGrow: 1, backgroundColor: c.paper, paddingHorizontal: 24, paddingBottom: 38 }, chartCard: { backgroundColor: c.panel, borderRadius: 32, padding: 23, marginTop: 30, marginBottom: 28 }, heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, sub: { fontSize: 11, color: c.muted, marginTop: 6 }, tabs: { flexDirection: 'row', gap: 10, marginTop: 20 }, legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, dot: { width: 7, height: 7, backgroundColor: c.ink, borderRadius: 4 }, breakdown: { marginBottom: 32 }, demo: { fontSize: 11, color: c.muted, textAlign: 'center', paddingTop: 15 } });
