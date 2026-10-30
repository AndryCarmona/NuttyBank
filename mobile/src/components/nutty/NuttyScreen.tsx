import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAccounts } from '@/components/cards/store';
import { colors as c } from '@/components/home/data';
import { useAuth } from '@/context/auth-context';
import { sendChat } from '@/lib/api';
import { buildFinanceContext } from './context';
import { cleanReply } from './format';
import { pickSuggestions } from './questions';
import {
  loadConversations,
  loadUseData,
  removeConversation,
  saveConversations,
  saveUseData,
  upsertConversation,
  type Conversation,
  type Msg,
} from './history';

const mascot = require('@/assets/images/nutty-mascot.png');

// El saludo solo existe en pantalla: no se guarda ni se manda al asistente.
const WELCOME: Msg = {
  id: 'welcome',
  role: 'assistant',
  content: '¡Hola! Soy Nutty 🐿️ Te ayudo a entender tu dinero: ahorro, presupuesto, tarjetas y más. ¿Qué quieres aprender hoy?',
};

// Últimas sugerencias mostradas: la siguiente conversación nueva evita repetirlas.
let lastSuggestions: string[] = [];

// El backend acepta hasta 20 mensajes de historial.
const MAX_HISTORY = 20;

const newConversationId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function Avatar() {
  return (
    <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Image source={mascot} style={styles.avatarImage} resizeMode="cover" />
    </View>
  );
}

export default function NuttyScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const accounts = useAccounts();

  const [convId, setConvId] = useState(newConversationId);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [useData, setUseData] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<Msg>>(null);
  const counter = useRef(0);
  const saved = useRef<Conversation[]>([]);
  // Tres preguntas del banco que cambian cada vez que empieza una conversación nueva.
  const [suggestions, setSuggestions] = useState<string[]>(() => {
    const picked = pickSuggestions({ avoid: lastSuggestions });
    lastSuggestions = picked;
    return picked;
  });

  // Carga el historial y la preferencia de este usuario.
  useEffect(() => {
    if (!userId) return;
    let active = true;
    Promise.all([loadConversations(userId), loadUseData(userId)]).then(([list, pref]) => {
      if (!active) return;
      saved.current = list;
      setConversations(list);
      setUseData(pref);
      // Sin permiso para usar sus datos, no se sugieren preguntas sobre ellos.
      if (!pref) {
        const picked = pickSuggestions({ withData: false, avoid: lastSuggestions });
        lastSuggestions = picked;
        setSuggestions(picked);
      }
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  // Guarda la conversación cada vez que cambia.
  useEffect(() => {
    if (!loaded || !userId || messages.length === 0) return;
    const next = upsertConversation(saved.current, convId, messages, Date.now());
    saved.current = next;
    setConversations(next);
    saveConversations(userId, next);
  }, [messages, convId, loaded, userId]);

  async function ask(history: Msg[]) {
    setPending(true);
    setError(null);
    try {
      const turns = history.slice(-MAX_HISTORY).map((m) => ({ role: m.role, content: m.content }));
      const context = useData ? buildFinanceContext(accounts) : undefined;
      const reply = await sendChat(turns, context);
      setMessages((current) => [...current, { id: `n${counter.current++}`, role: 'assistant', content: cleanReply(reply) }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos hablar con Nutty. Inténtalo de nuevo.');
    } finally {
      setPending(false);
    }
  }

  function submit(text?: string) {
    const content = (text ?? input).trim();
    if (!content || pending) return;
    const history = [...messages, { id: `u${counter.current++}`, role: 'user' as const, content }];
    setMessages(history);
    setInput('');
    ask(history);
  }

  function refreshSuggestions(withData = useData) {
    const picked = pickSuggestions({ withData, avoid: lastSuggestions });
    lastSuggestions = picked;
    setSuggestions(picked);
  }

  function startNew() {
    if (pending) return;
    refreshSuggestions();
    setConvId(newConversationId());
    setMessages([]);
    setError(null);
    setInput('');
  }

  function open(conversation: Conversation) {
    if (pending) return;
    setConvId(conversation.id);
    setMessages(conversation.messages);
    setError(null);
    setInput('');
    setHistoryOpen(false);
  }

  function remove(id: string) {
    if (!userId) return;
    const next = removeConversation(saved.current, id);
    saved.current = next;
    setConversations(next);
    saveConversations(userId, next);
    if (id === convId) startNew();
  }

  function toggleData(value: boolean) {
    setUseData(value);
    // Si se apaga "usar mis datos" no se sugieren preguntas sobre ellos.
    if (messages.length === 0) refreshSuggestions(value);
    if (userId) saveUseData(userId, value);
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  const canSend = input.trim().length > 0 && !pending;
  const data: Msg[] = [WELCOME, ...messages];

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver al inicio" onPress={goBack} style={styles.back}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={styles.title}>Nutty</Text>
          <Text style={styles.subtitle}>Tu asistente de finanzas</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={pending}
          onPress={() => setHistoryOpen(true)}
          style={[styles.pill, pending && styles.dim]}>
          <Text style={styles.pillText}>Historial</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={pending} onPress={startNew} style={[styles.pill, styles.pillDark, pending && styles.dim]}>
          <Text style={[styles.pillText, { color: '#FFFFFF' }]}>Nueva</Text>
        </Pressable>
      </View>

      <View style={styles.dataRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.dataTitle}>Usar mis tarjetas y movimientos</Text>
          <Text style={styles.dataHint}>
            {useData
              ? 'Nutty ve un resumen de tus últimos 90 días (sin números de tarjeta). Se envía a Gemini, de Google.'
              : 'Nutty responde sin ver tus datos.'}
          </Text>
        </View>
        <Switch
          accessibilityLabel="Usar mis tarjetas y movimientos"
          value={useData}
          onValueChange={toggleData}
          trackColor={{ true: c.green, false: '#C9CDD2' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(m) => m.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) =>
          item.role === 'user' ? (
            <View style={[styles.bubble, styles.userBubble]}>
              <Text selectable style={[styles.bubbleText, { color: '#FFFFFF' }]}>{item.content}</Text>
            </View>
          ) : (
            <View style={styles.nuttyRow}>
              <Avatar />
              <View style={[styles.bubble, styles.nuttyBubble]}>
                <Text selectable style={styles.bubbleText}>{item.content}</Text>
              </View>
            </View>
          )
        }
        ListFooterComponent={
          <View style={{ gap: 12 }}>
            {pending ? (
              <View accessibilityLabel="Nutty está escribiendo" style={styles.nuttyRow}>
                <Avatar />
                <View style={[styles.bubble, styles.nuttyBubble, styles.typing]}>
                  <ActivityIndicator color={c.ink} />
                  <Text style={styles.typingText}>Nutty está pensando…</Text>
                </View>
              </View>
            ) : null}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable accessibilityRole="button" onPress={() => ask(messages)} style={styles.retry}>
                  <Text style={styles.retryText}>Reintentar</Text>
                </Pressable>
              </View>
            ) : null}
            {messages.length === 0 && !pending ? (
              <View style={styles.chips}>
                {suggestions.map((s) => (
                  <Pressable key={s} accessibilityRole="button" onPress={() => submit(s)} style={({ pressed }) => [styles.chip, pressed && { opacity: 0.6 }]}>
                    <Text style={styles.chipText}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        }
      />

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 10 }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Escribe tu pregunta…"
          placeholderTextColor={c.muted}
          accessibilityLabel="Mensaje para Nutty"
          multiline
          maxLength={1000}
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar mensaje"
          accessibilityState={{ disabled: !canSend }}
          disabled={!canSend}
          onPress={() => submit()}
          style={({ pressed }) => [styles.send, !canSend && styles.sendDisabled, pressed && canSend && styles.sendPressed]}>
          <Ionicons name="paper-plane" size={26} color={canSend ? '#FFFFFF' : c.muted} style={styles.sendIcon} />
        </Pressable>
      </View>

      <Modal visible={historyOpen} transparent animationType="slide" onRequestClose={() => setHistoryOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setHistoryOpen(false)} accessibilityLabel="Cerrar historial" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHeader}>
            <Text accessibilityRole="header" style={styles.sheetTitle}>Tus conversaciones</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={() => setHistoryOpen(false)} style={styles.close}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
          {conversations.length === 0 ? (
            <Text style={styles.empty}>Aquí aparecerán tus conversaciones con Nutty.</Text>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 10 }}
              renderItem={({ item }) => (
                <View style={[styles.convRow, item.id === convId && styles.convActive]}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Abrir conversación: ${item.title}`} onPress={() => open(item)} style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={styles.convTitle}>{item.title}</Text>
                    <Text style={styles.convMeta}>
                      {new Date(item.updatedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} · {item.messages.length} mensajes
                    </Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Borrar conversación: ${item.title}`} onPress={() => remove(item.id)} style={styles.delete}>
                    <Text style={styles.deleteText}>✕</Text>
                  </Pressable>
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.paper },
  header: { backgroundColor: c.green, paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 27, color: c.ink },
  title: { fontSize: 22, fontWeight: '700', color: c.ink },
  subtitle: { fontSize: 12, color: c.ink, opacity: 0.8 },
  pill: { paddingHorizontal: 12, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF66' },
  pillDark: { backgroundColor: c.ink },
  pillText: { fontSize: 13, fontWeight: '600', color: c.ink },
  dim: { opacity: 0.4 },
  dataRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#F0F3ED', borderBottomWidth: 1, borderBottomColor: '#E3E6E3' },
  dataTitle: { fontSize: 13, fontWeight: '600', color: c.ink },
  dataHint: { fontSize: 11, color: c.muted, marginTop: 2, lineHeight: 15 },
  list: { flex: 1 },
  listContent: { padding: 20, gap: 12, flexGrow: 1 },
  nuttyRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '92%', alignSelf: 'flex-start' },
  avatar: { width: 34, height: 34, borderRadius: 17, overflow: 'hidden', backgroundColor: '#DDE8D8', borderWidth: 1, borderColor: '#C9D8C3' },
  avatarImage: { width: '100%', height: '100%' },
  bubble: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, flexShrink: 1 },
  nuttyBubble: { backgroundColor: c.panel, borderBottomLeftRadius: 6 },
  userBubble: { alignSelf: 'flex-end', maxWidth: '84%', backgroundColor: c.ink, borderBottomRightRadius: 6 },
  bubbleText: { fontSize: 15, lineHeight: 22, color: c.ink },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typingText: { fontSize: 13, color: c.muted },
  chips: { gap: 8, alignItems: 'flex-start' },
  chip: { borderWidth: 1, borderColor: c.green, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#F0F3ED' },
  chipText: { fontSize: 14, color: c.ink },
  errorBox: { backgroundColor: '#FDE7E4', borderRadius: 16, padding: 14, gap: 8 },
  errorText: { fontSize: 13, color: '#912018', lineHeight: 19 },
  retry: { alignSelf: 'flex-start', paddingVertical: 6 },
  retryText: { fontSize: 14, fontWeight: '700', color: '#912018', textDecorationLine: 'underline' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 10, backgroundColor: c.paper, borderTopWidth: 1, borderTopColor: '#E3E6E3' },
  input: {
    flex: 1,
    minHeight: 58,
    maxHeight: 130,
    borderRadius: 29,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 18 : 15,
    paddingBottom: Platform.OS === 'ios' ? 18 : 15,
    backgroundColor: c.panel,
    fontSize: 15,
    color: c.ink,
  },
  send: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: c.green,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: c.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
  sendDisabled: { backgroundColor: c.panel, borderColor: c.panel, elevation: 0, shadowOpacity: 0 },
  sendPressed: { transform: [{ scale: 0.92 }], opacity: 0.9 },
  // El avión de papel se ve centrado si se mueve un poco hacia la derecha.
  sendIcon: { marginLeft: 3, marginTop: 1 },
  backdrop: { flex: 1, backgroundColor: '#00000066' },
  sheet: { maxHeight: '75%', backgroundColor: c.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 18 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: c.ink },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 18, color: c.ink },
  empty: { fontSize: 14, color: c.muted, paddingVertical: 24, textAlign: 'center' },
  convRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.panel, borderRadius: 18, paddingLeft: 16, paddingRight: 4, paddingVertical: 8, borderWidth: 1, borderColor: 'transparent' },
  convActive: { borderColor: c.green },
  convTitle: { fontSize: 15, fontWeight: '600', color: c.ink },
  convMeta: { fontSize: 12, color: c.muted, marginTop: 2 },
  delete: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontSize: 15, color: c.muted },
});
