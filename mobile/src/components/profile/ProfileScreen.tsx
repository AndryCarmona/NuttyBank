import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { fetchMe } from '@/lib/api';
import { Page } from '@/components/home/components';
import { NavigationIcon } from '@/components/home/NavigationIcon';
import { colors as c } from '@/components/home/data';

function value(input: unknown) { return typeof input === 'string' && input.trim() ? input.trim() : null; }
function displayDate(input: string | null) {
  if (!input || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return 'No registrado';
  const date = new Date(`${input}T12:00:00`);
  return Number.isNaN(date.getTime()) ? 'No registrado' : date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}
export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const profile = useQuery({ queryKey: ['me', session?.user.id], queryFn: fetchMe, enabled: !!session });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const metadata = session?.user.user_metadata ?? {};
  const username = value(profile.data?.username) ?? value(metadata.username);
  const name = value(metadata.full_name) ?? value(metadata.name) ?? username ?? 'Tu perfil';
  const email = value(profile.data?.email) ?? value(session?.user.email) ?? 'No registrado';
  const phone = value(profile.data?.phone) ?? value(metadata.phone) ?? value(session?.user.phone) ?? 'No registrado';
  const birthDate = value(profile.data?.birth_date) ?? value(metadata.birth_date);
  const logout = async () => {
    if (pending) return;
    setPending(true);
    setError('');
    try { await signOut(); }
    catch { setError('No pudimos cerrar la sesión. Revisa tu conexión y vuelve a intentarlo.'); }
    finally { setPending(false); }
  };
  return <Page title="Perfil">
    <View style={styles.body}>
      <View style={styles.identity}>
        <View style={styles.avatar}><NavigationIcon name="Perfil" size={54} /></View>
        <Text accessibilityRole="header" style={styles.name}>{name}</Text>
        {username && <Text style={styles.username}>@{username}</Text>}
      </View>
      <View style={styles.information}>
        <Text style={styles.heading}>Información general</Text>
        {profile.isPending && <ActivityIndicator accessibilityLabel="Cargando información del perfil" color={c.green} />}
        {[['Nombre de usuario', username ?? 'No registrado'], ['Correo electrónico', email], ['Teléfono', phone], ['Fecha de nacimiento', displayDate(birthDate)]].map(([label, content]) => <View key={label} style={styles.field}><Text style={styles.label}>{label}</Text><Text selectable style={styles.value}>{content}</Text></View>)}
        {profile.isError && <Text style={styles.note}>Mostramos la información disponible de tu sesión. No pudimos actualizar el perfil en este momento.</Text>}
      </View>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: pending, busy: pending }} disabled={pending} onPress={logout} style={({ pressed }) => [styles.logout, { opacity: pending || pressed ? .65 : 1 }]}>
        <View style={styles.logoutIcon}><NavigationIcon name="CerrarSesion" size={26} /></View><Text style={styles.logoutText}>{pending ? 'Cerrando sesión…' : 'Cerrar sesión'}</Text>{pending ? <ActivityIndicator color="#35583E" /> : <Text style={styles.arrow}>›</Text>}
      </Pressable>
    </View>
  </Page>;
}
const styles = StyleSheet.create({
  body: { flexGrow: 1, backgroundColor: c.paper, paddingHorizontal: 26, paddingBottom: 36, gap: 24 }, identity: { alignItems: 'center', gap: 9, paddingBottom: 8 }, avatar: { width: 100, height: 100, backgroundColor: '#E3ECDd', borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }, name: { fontSize: 22, fontWeight: '700', color: c.ink, textAlign: 'center' }, username: { fontSize: 13, color: c.muted },
  information: { backgroundColor: '#EFF2EB', borderRadius: 26, padding: 22, gap: 17 }, heading: { fontSize: 16, fontWeight: '600', color: c.ink }, field: { gap: 5 }, label: { fontSize: 12, color: '#526657' }, value: { fontSize: 15, color: c.ink, lineHeight: 23 }, note: { fontSize: 12, color: c.muted, lineHeight: 19 },
  logout: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 24, padding: 14, backgroundColor: '#E4EDDE', minHeight: 68 }, logoutIcon: { backgroundColor: c.green, borderRadius: 17 }, logoutText: { flex: 1, color: c.ink, fontSize: 16, fontWeight: '600' }, arrow: { color: '#35583E', fontSize: 27 }, error: { color: '#912018', fontSize: 13, lineHeight: 21 },
});
