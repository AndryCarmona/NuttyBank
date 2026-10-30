import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors as c } from '@/components/home/data';
import { PIN_NOTICE, validPin } from './card-utils';
import { deletePin, pinSupported, readPin, savePin } from './pin-store';
import { setCardHasPin, storageUserId, type Card } from './store';

const HIDE_AFTER_MS = 15000;

function Btn({ label, onPress, dark = false }: { label: string; onPress: () => void; dark?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.btn, dark && { backgroundColor: c.ink }, pressed && { opacity: .7 }]}><Text style={[styles.btnText, dark && { color: '#fff' }]}>{label}</Text></Pressable>;
}

// Panel del NIP en el detalle de la tarjeta: guardar, mostrar (se oculta solo), cambiar y eliminar.
export default function CardPin({ card }: { card: Card }) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);
  const hide = () => { clearTimeout(timer.current); setRevealed(null); };

  async function show() {
    setMessage('');
    try {
      const pin = await readPin(storageUserId(), card.id);
      if (!pin) { setCardHasPin(card.id, false); setMessage('No encontramos el NIP guardado. Vuelve a guardarlo.'); return; }
      setRevealed(pin);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setRevealed(null), HIDE_AFTER_MS);
    } catch { setMessage('No pudimos leer el NIP. Inténtalo de nuevo.'); }
  }
  async function save() {
    if (!validPin(value)) { setMessage('El NIP debe tener de 4 a 6 dígitos.'); return; }
    try {
      await savePin(storageUserId(), card.id, value);
      setCardHasPin(card.id, true);
      hide(); setEditing(false); setValue(''); setMessage('NIP guardado en tu teléfono.');
    } catch (e) { setMessage((e as Error).message || 'No pudimos guardar el NIP.'); }
  }
  async function remove() {
    try { await deletePin(storageUserId(), card.id); setCardHasPin(card.id, false); hide(); setMessage('NIP eliminado de tu teléfono.'); }
    catch { setMessage('No pudimos eliminar el NIP. Inténtalo de nuevo.'); }
  }
  const confirmRemove = () => {
    if (Platform.OS === 'web') { remove(); return; }
    Alert.alert('Eliminar NIP', 'Se borrará de tu teléfono. Tu tarjeta y sus movimientos no cambian.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: remove }]);
  };

  return <View style={styles.box}>
    <Text accessibilityRole="header" style={styles.title}>NIP de la tarjeta (opcional)</Text>
    <Text style={styles.note}>{PIN_NOTICE}</Text>
    {!pinSupported ? <Text style={styles.note}>El NIP solo se puede guardar en la app del teléfono.</Text> : <>
      {card.hasPin && !editing && <>
        <Text accessibilityLabel={revealed ? `NIP: ${revealed.split('').join(' ')}` : 'NIP oculto'} style={styles.pin}>{revealed ?? '••••'}</Text>
        <View style={styles.row}>
          <Btn label={revealed ? 'Ocultar NIP' : 'Mostrar NIP'} onPress={revealed ? hide : show} />
          <Btn label="Cambiar" onPress={() => { hide(); setMessage(''); setEditing(true); }} />
        </View>
        <Btn label="Eliminar NIP" dark onPress={confirmRemove} />
      </>}
      {!card.hasPin && !editing && <Btn label="Guardar NIP" onPress={() => { setMessage(''); setEditing(true); }} />}
      {editing && <>
        <TextInput accessibilityLabel="NIP de la tarjeta" value={value} onChangeText={text => setValue(text.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" secureTextEntry maxLength={6} placeholder="4 a 6 dígitos" placeholderTextColor={c.muted} style={styles.input} />
        <View style={styles.row}><Btn label="Guardar" onPress={save} /><Btn label="Cancelar" dark onPress={() => { setEditing(false); setValue(''); setMessage(''); }} /></View>
      </>}
    </>}
    {!!message && <Text accessibilityRole="alert" style={styles.message}>{message}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#F1F4EE', borderRadius: 22, padding: 18, gap: 10, marginBottom: 15, borderWidth: 1, borderColor: '#DDE5D6' },
  title: { fontSize: 15, fontWeight: '700', color: c.ink },
  note: { fontSize: 11, color: c.muted, lineHeight: 17 },
  pin: { fontSize: 30, fontWeight: '700', color: c.ink, letterSpacing: 8, textAlign: 'center', paddingVertical: 6 },
  row: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, backgroundColor: c.green, borderRadius: 22, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  btnText: { color: c.ink, fontWeight: '600', fontSize: 13 },
  input: { borderWidth: 1, borderColor: '#C9D3CC', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, fontSize: 18, letterSpacing: 6, color: c.ink, backgroundColor: '#fff' },
  message: { fontSize: 12, color: c.ink, fontWeight: '600' },
});
