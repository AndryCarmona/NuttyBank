import { Pressable, StyleSheet, Text } from 'react-native';
import { colors as c } from '../home/data';
export function Action({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} accessibilityState={{ disabled }} onPress={onPress} style={({ pressed }) => [styles.action, { opacity: disabled ? .4 : pressed ? .7 : 1 }]}><Text style={styles.actionText}>{label}</Text></Pressable>;
}
export function Choice({ label, selected, onPress, compact = false }: { label: string; selected: boolean; onPress: () => void; compact?: boolean }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={({ pressed }) => [styles.choice, compact && { padding: 10 }, selected && styles.chosen, pressed && { opacity: .7 }]}><Text style={[styles.text, compact && { fontSize: 14, lineHeight: 20 }]}>{selected ? '●' : '○'}  {label}</Text></Pressable>;
}
export const styles = StyleSheet.create({
  warning: { backgroundColor: "#FFF0DD", borderWidth: 1, borderColor: "#D97720", borderLeftWidth: 4 },
  body: { backgroundColor: c.paper, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 24, paddingBottom: 45, gap: 18, flexGrow: 1 },
  heading: { fontSize: 23, fontWeight: '700', color: c.ink, lineHeight: 32 }, text: { color: c.ink, fontSize: 15, lineHeight: 24 }, muted: { color: '#526657', fontSize: 13, lineHeight: 21 }, eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: '#45684B' },
  card: { padding: 20, backgroundColor: '#EDF2E9', borderRadius: 26, gap: 12 }, bubble: { backgroundColor: c.green, padding: 26, borderRadius: 32, gap: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }, action: { backgroundColor: '#35583E', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 22, alignItems: 'center', minHeight: 48 }, actionText: { color: 'white', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  choice: { borderWidth: 1, borderColor: '#CED9CB', borderRadius: 18, padding: 15, backgroundColor: c.paper }, chosen: { borderColor: '#35583E', backgroundColor: '#D8E6D3', borderWidth: 2 }, track: { height: 9, backgroundColor: '#DDE5D9', borderRadius: 8, overflow: 'hidden' }, fill: { backgroundColor: '#35583E', height: '100%', borderRadius: 8 }, mascot: { width: 150, height: 160, alignSelf: 'center' },
});
