import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors as c } from '@/components/home/data';
import { sendChat } from '@/lib/api';
import { cleanReply } from './format';

type Msg = { id: string; role: 'user' | 'assistant'; content: string };

const WELCOME: Msg = {
  id: 'welcome',
  role: 'assistant',
  content: '¡Hola! Soy Nutty 🐿️ Te ayudo a entender tu dinero: ahorro, presupuesto, tarjetas y más. ¿Qué quieres aprender hoy?',
};

const SUGGESTIONS = ['¿Cómo empiezo a ahorrar?', '¿Qué es el interés?', '¿Cómo armo un presupuesto?'];

// El backend acepta hasta 20 mensajes de historial.
const MAX_HISTORY = 20;

export default function NuttyScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<Msg>>(null);
  const counter = useRef(0);

  async function ask(history: Msg[]) {
    setPending(true);
    setError(null);
    try {
      // El saludo inicial solo existe en pantalla: no se manda al asistente.
      const turns = history
        .filter((m) => m.id !== WELCOME.id)
        .slice(-MAX_HISTORY)
        .map((m) => ({ role: m.role, content: m.content }));
      const reply = await sendChat(turns);
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

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  const canSend = input.trim().length > 0 && !pending;

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
        <Image source={require('@/assets/images/nutty-mascot.png')} style={styles.mascot} resizeMode="contain" />
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.nuttyBubble]}>
            <Text selectable style={[styles.bubbleText, item.role === 'user' && { color: '#FFFFFF' }]}>{item.content}</Text>
          </View>
        )}
        ListFooterComponent={
          <View style={{ gap: 12 }}>
            {pending ? (
              <View accessibilityLabel="Nutty está escribiendo" style={[styles.bubble, styles.nuttyBubble, styles.typing]}>
                <ActivityIndicator color={c.ink} />
                <Text style={styles.typingText}>Nutty está pensando…</Text>
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
            {messages.length === 1 && !pending ? (
              <View style={styles.chips}>
                {SUGGESTIONS.map((s) => (
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
          style={[styles.send, !canSend && { opacity: 0.4 }]}>
          <Text style={styles.sendText}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.paper },
  header: { backgroundColor: c.green, paddingHorizontal: 20, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 27, color: c.ink },
  title: { fontSize: 22, fontWeight: '700', color: c.ink },
  subtitle: { fontSize: 12, color: c.ink, opacity: 0.8 },
  mascot: { width: 52, height: 52 },
  list: { flex: 1 },
  listContent: { padding: 20, gap: 12, flexGrow: 1 },
  bubble: { maxWidth: '84%', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12 },
  nuttyBubble: { alignSelf: 'flex-start', backgroundColor: c.panel, borderBottomLeftRadius: 6 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: c.ink, borderBottomRightRadius: 6 },
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
    minHeight: 46,
    maxHeight: 120,
    borderRadius: 23,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 13 : 10,
    paddingBottom: Platform.OS === 'ios' ? 13 : 10,
    backgroundColor: c.panel,
    fontSize: 15,
    color: c.ink,
  },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center' },
  sendText: { fontSize: 22, color: '#FFFFFF', fontWeight: '700' },
});
