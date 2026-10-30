import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Page, s } from '@/components/home/components';
import { NavigationIcon } from '@/components/home/NavigationIcon';
import { colors as c, money } from '@/components/home/data';
import DateField from '@/components/cards/DateField';
import { addGoal, contribute, localDate, useAccounts, type Goal } from '@/components/cards/store';
import { savingsAmount, savingsDate, savingsMessage } from '@/components/cards/savings-utils';

// Aviso de la última aportación: se guarda fuera del componente porque la pantalla del formulario se cierra al guardar.
let pendingNotice: string | null = null;
const categories = ['Viaje', 'Casa', 'Coche', 'Boda', 'Estudios', 'Emergencias', 'Otro'];
function icon(category: string) { return ['Viaje', 'Casa', 'Coche', 'Boda'].includes(category) ? category : category === 'Nueva casa' ? 'Casa' : 'Ahorros'; }
function Button({ title, onPress }: { title: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.button, pressed && { opacity: .7 }]}><Text style={styles.buttonText}>{title}</Text></Pressable>;
}
function Field({ label, value, onChange, numeric = false, multiline = false }: { label: string; value: string; onChange: (value: string) => void; numeric?: boolean; multiline?: boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} keyboardType={numeric ? 'decimal-pad' : 'default'} multiline={multiline} style={[styles.input, multiline && { minHeight: 100, textAlignVertical: 'top' }]} /></View>;
}
function Progress({ goal }: { goal: Goal }) {
  const percentage = Math.round(goal.saved / goal.target * 100);
  return <View style={styles.progressBox}><View style={styles.progressLabels}><Text style={styles.strong}>{percentage}%</Text><Text style={styles.label}>{money(goal.target)}</Text></View><View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.min(100, percentage), text: `${percentage}% de la meta` }} style={styles.track}><View style={[styles.fill, { width: `${Math.min(100, percentage)}%` }]} /></View><Text style={styles.encouragement}>{savingsMessage(goal.saved, goal.target)}</Text></View>;
}

export default function SavingsScreen() {
  const { view = 'savings', goal: goalId } = useLocalSearchParams<{ view?: string; goal?: string }>();
  const data = useAccounts();
  const goal = data.goals.find(item => item.id === goalId);
  const [category, setCategory] = useState('Viaje');
  const [customCategory, setCustomCategory] = useState('');
  const [target, setTarget] = useState('');
  const [initial, setInitial] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [selectedGoal, setSelectedGoal] = useState(goalId ?? '');
  const [date, setDate] = useState(localDate);
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const submitted = useRef(false);
  const [notice, setNotice] = useState('');
  // Cada vez que la pantalla recibe el foco el formulario queda limpio y se vuelve a permitir guardar.
  useFocusEffect(useCallback(() => {
    submitted.current = false;
    setAmount(''); setConcept(''); setNote(''); setError(''); setDate(localDate());
    if (pendingNotice) { setNotice(pendingNotice); pendingNotice = null; }
  }, [setAmount, setConcept, setNote, setError, setDate, setNotice]));
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  const navigate = (next: string, id?: string, replace = false) => {
    const route = { pathname: '/cards' as const, params: { view: next, ...(id ? { goal: id } : {}) } };
    if (replace) router.replace(route); else router.push(route);
  };
  function createSaving() {
    if (submitted.current) return;
    const name = category === 'Otro' ? customCategory.trim() : category;
    if (!savingsDate(deadline)) { setError('Selecciona la fecha final para tu ahorro.'); return; }
    try {
      const id = addGoal(name, savingsAmount(target), initial.trim() ? savingsAmount(initial) : 0, deadline, name);
      submitted.current = true;
      navigate('goal', id, true);
    } catch (e) { setError((e as Error).message); }
  }
  function saveContribution() {
    if (submitted.current) return;
    try {
      const value = savingsAmount(amount);
      contribute(selectedGoal, value, date, concept, note);
      submitted.current = true;
      const goalName = data.goals.find(item => item.id === selectedGoal)?.name ?? 'tu ahorro';
      pendingNotice = `Listo: se añadieron ${money(value)} a «${goalName}».`;
      setAmount(''); setConcept(''); setNote(''); setError('');
      if (selectedGoal === goalId && router.canGoBack()) router.back();
      else navigate('goal', selectedGoal, true);
    } catch (e) { setError((e as Error).message); }
  }
  const title = view === 'new-saving' ? 'Nuevo ahorro' : view === 'contribution' ? 'Añadir ahorro' : view === 'goal' ? goal?.name ?? 'Ahorro' : 'Ahorros';
  if (!data.ready) return <Page title="Ahorros" green><Text style={s.empty}>Cargando tus ahorros…</Text></Page>;
  if (data.storageError) return <Page title="Ahorros" green><Text style={styles.error}>{data.storageError}</Text></Page>;
  if (view === 'goal' && !goal) return <Page title="Ahorro" green><View style={s.body}><Text style={s.empty}>Este ahorro no está disponible.</Text><Button title="Ver mis ahorros" onPress={() => navigate('savings', undefined, true)} /></View></Page>;
  return <Page title={title} green><View style={[s.body, styles.body]}>
    {view === 'savings' && <>
      <Text style={styles.heading}>Mis ahorros</Text><Text style={styles.secondary}>Cada meta empieza con un pequeño paso.</Text>
      <View style={styles.grid}>{data.goals.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Ver ahorro ${item.name}`} onPress={() => navigate('goal', item.id)} style={styles.tile}><View style={styles.icon}><NavigationIcon name={icon(item.category ?? item.name)} size={36} /></View><Text style={styles.tileTitle}>{item.name}</Text><Text style={styles.strong}>{money(item.saved)}</Text><Text style={styles.secondary}>de {money(item.target)}</Text><View style={styles.miniTrack}><View style={[styles.fill, { width: `${Math.min(100, item.saved / item.target * 100)}%` }]} /></View><Text style={styles.secondary}>{Math.round(item.saved / item.target * 100)}% de tu meta</Text></Pressable>)}</View>
      {!data.goals.length && <Text style={s.empty}>Todavía no tienes ahorros. Crea tu primera meta.</Text>}
      <Button title="＋ Añadir ahorro nuevo" onPress={() => navigate('new-saving')} />
    </>}
    {view === 'new-saving' && <>
      <Text style={styles.heading}>¿Para qué quieres ahorrar?</Text><Text style={styles.label}>Categoría</Text>
      <View style={styles.choices}>{categories.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: category === item }} onPress={() => setCategory(item)} style={[styles.choice, category === item && styles.selected]}><Text style={styles.label}>{item}</Text></Pressable>)}</View>
      {category === 'Otro' && <Field label="Nombre de la categoría" value={customCategory} onChange={setCustomCategory} />}
      <Field label="Meta de ahorro ($)" value={target} onChange={setTarget} numeric />
      <Field label="¿Cuánto tienes ahorrado? ($, opcional)" value={initial} onChange={setInitial} numeric />
      <DateField label="Fecha final del ahorro" value={deadline} onChange={setDeadline} />
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}<Button title="Crear ahorro" onPress={createSaving} />
    </>}
    {view === 'goal' && goal && <>
      {!!notice && <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.notice}><Text style={styles.noticeIcon}>✓</Text><Text style={styles.noticeText}>{notice}</Text><Pressable accessibilityRole="button" accessibilityLabel="Cerrar aviso" hitSlop={10} onPress={() => setNotice('')}><Text style={styles.noticeClose}>✕</Text></Pressable></View>}
      <View style={styles.overview}><View style={{ flex: 1, gap: 16 }}><View><Text style={styles.secondary}>Meta</Text><Text style={styles.amount}>{money(goal.target)}</Text></View><View><Text style={styles.secondary}>Importe ahorrado</Text><Text style={styles.amount}>{money(goal.saved)}</Text></View></View><View style={styles.goalIcon}><NavigationIcon name={icon(goal.category ?? goal.name)} size={44} /><Text style={styles.tileTitle}>{goal.category ?? goal.name}</Text></View></View>
      <Progress goal={goal} />
      <View style={styles.deadline}><Text style={styles.label}>{goal.deadline ? `Fecha final: ${new Date(goal.deadline + 'T12:00:00').toLocaleDateString('es-MX')}` : 'Sin fecha final'}</Text><Text style={styles.secondary}>{goal.saved >= goal.target ? '¡Objetivo alcanzado!' : `Te faltan ${money(goal.target - goal.saved)}`}</Text>{goal.deadline && goal.deadline < localDate() && goal.saved < goal.target && <Text style={styles.secondary}>La fecha final pasó; puedes seguir aportando a tu meta.</Text>}</View>
      <Text style={styles.heading}>Tus aportaciones</Text>
      {(goal.initialSaved ?? goal.saved - (goal.contributions ?? []).reduce((sum, entry) => sum + entry.amount, 0)) > 0 && <View style={styles.entry}><NavigationIcon name="Ahorros" /><Text style={{ flex: 1, color: c.ink }}>Monto inicial</Text><Text style={styles.strong}>{money(goal.initialSaved ?? goal.saved - (goal.contributions ?? []).reduce((sum, entry) => sum + entry.amount, 0))}</Text></View>}
      {[...new Set((goal.contributions ?? []).map(entry => entry.date.slice(0, 7)))].sort().reverse().map(month => <View key={month}><Text style={styles.month}>{new Date(month + '-01T12:00:00').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</Text>{(goal.contributions ?? []).filter(entry => entry.date.startsWith(month)).sort((a,b) => b.date.localeCompare(a.date)).map(entry => <View key={entry.id} style={styles.entry}><View style={styles.entryIcon}><NavigationIcon name={icon(goal.category ?? goal.name)} /></View><View style={{ flex: 1 }}><Text style={styles.label}>{entry.concept}</Text><Text style={styles.secondary}>{new Date(entry.date + 'T12:00:00').toLocaleDateString('es-MX')}</Text>{!!entry.note && <Text style={styles.secondary}>{entry.note}</Text>}</View><Text style={styles.strong}>+{money(entry.amount)}</Text></View>)}</View>)}
      {!goal.contributions?.length && <Text style={s.empty}>Añade tu primera aportación para acercarte a tu meta.</Text>}
      <Button title="Añadir ahorro" onPress={() => navigate('contribution', goal.id)} />
    </>}
    {view === 'contribution' && <>
      <DateField label="Fecha de la aportación" value={date} onChange={setDate} />
      <Text style={styles.label}>Categoría / ahorro</Text><View style={styles.choices}>{data.goals.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: selectedGoal === item.id }} onPress={() => setSelectedGoal(item.id)} style={[styles.choice, selectedGoal === item.id && styles.selected]}><Text style={styles.label}>{item.name}</Text></Pressable>)}</View>
      <Field label="Importe ($)" value={amount} onChange={setAmount} numeric />
      <Field label="Concepto de la aportación" value={concept} onChange={setConcept} />
      <Field label="Escribe un mensaje (opcional)" value={note} onChange={setNote} multiline />
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}<Button title="Guardar" onPress={saveContribution} />
    </>}
  </View></Page>;
}
const styles = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#E3F4DA', borderColor: '#6DB84F', borderWidth: 1.5, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14, marginTop: 8 },
  noticeIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#3E8E2A', color: '#fff', textAlign: 'center', lineHeight: 26, fontWeight: '800', overflow: 'hidden' },
  noticeText: { flex: 1, color: c.ink, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  noticeClose: { color: c.ink, fontSize: 16, paddingHorizontal: 4 },
  body: { width: '100%', alignSelf: 'center' }, heading: { fontSize: 18, fontWeight: '700', color: c.ink, marginBottom: 12, marginTop: 12 }, secondary: { fontSize: 11, color: c.muted, lineHeight: 17 }, label: { fontSize: 13, color: c.ink }, strong: { fontSize: 13, fontWeight: '600', color: c.ink }, amount: { fontSize: 20, fontWeight: '700', color: c.ink, marginTop: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginVertical: 22 }, tile: { width: '47%', backgroundColor: '#EDF2E9', borderRadius: 24, padding: 14, alignItems: 'center', gap: 7 }, icon: { backgroundColor: c.green, borderRadius: 22, padding: 8 }, tileTitle: { fontSize: 13, fontWeight: '600', textAlign: 'center', color: c.ink },
  button: { backgroundColor: c.green, borderRadius: 24, padding: 15, minHeight: 48, marginVertical: 18, alignItems: 'center' }, buttonText: { color: c.ink, fontSize: 14, fontWeight: '600' }, field: { gap: 8, marginBottom: 20 }, input: { backgroundColor: c.panel, borderRadius: 18, padding: 15, minHeight: 48, color: c.ink }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 12, marginBottom: 22 }, choice: { backgroundColor: c.panel, borderRadius: 16, padding: 13 }, selected: { backgroundColor: '#BED4B7', borderColor: c.green, borderWidth: 1 },
  overview: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16 }, goalIcon: { backgroundColor: c.green, borderRadius: 28, padding: 18, maxWidth: '45%', alignItems: 'center', gap: 8 }, progressBox: { gap: 9, marginVertical: 20 }, progressLabels: { flexDirection: 'row', justifyContent: 'space-between' }, track: { height: 12, backgroundColor: '#E2E8DE', borderRadius: 9, overflow: 'hidden' }, miniTrack: { height: 6, backgroundColor: '#DCE5D5', borderRadius: 4, overflow: 'hidden', width: '100%' }, fill: { backgroundColor: '#436B4C', height: '100%', borderRadius: 9 }, encouragement: { fontSize: 12, color: '#436B4C', lineHeight: 19 }, deadline: { backgroundColor: c.panel, borderRadius: 18, padding: 14, gap: 5, marginBottom: 20 }, month: { color: c.muted, fontSize: 12, textTransform: 'capitalize', marginVertical: 12 }, entry: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }, entryIcon: { borderRadius: 16, backgroundColor: '#D9E7D1' }, error: { color: '#A33333', lineHeight: 20, marginVertical: 10 },
});

