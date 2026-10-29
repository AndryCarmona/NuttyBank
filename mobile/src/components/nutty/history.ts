import AsyncStorage from '@react-native-async-storage/async-storage';

export type Msg = { id: string; role: 'user' | 'assistant'; content: string };
export type Conversation = { id: string; title: string; updatedAt: number; messages: Msg[] };

export const MAX_CONVERSATIONS = 30;
export const MAX_MESSAGES_PER_CONVERSATION = 100;

// Las conversaciones viven en el teléfono, separadas por usuario (igual que las tarjetas).
const chatsKey = (userId: string) => `nuttybank-nutty-chats-v1:${userId}`;
const prefsKey = (userId: string) => `nuttybank-nutty-prefs-v1:${userId}`;

/** El título es el primer mensaje del usuario, recortado. */
export function titleFor(messages: Msg[]): string {
  const first = messages.find((m) => m.role === 'user')?.content.trim().replace(/\s+/g, ' ') ?? '';
  if (!first) return 'Conversación nueva';
  return first.length > 40 ? `${first.slice(0, 39)}…` : first;
}

/** Guarda (o actualiza) una conversación, deja la más reciente primero y recorta lo que sobre. */
export function upsertConversation(list: Conversation[], id: string, messages: Msg[], now: number): Conversation[] {
  if (!messages.some((m) => m.role === 'user')) return list; // no se guardan conversaciones vacías
  const conversation: Conversation = {
    id,
    title: titleFor(messages),
    updatedAt: now,
    messages: messages.slice(-MAX_MESSAGES_PER_CONVERSATION),
  };
  return [conversation, ...list.filter((c) => c.id !== id)]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CONVERSATIONS);
}

export function removeConversation(list: Conversation[], id: string): Conversation[] {
  return list.filter((c) => c.id !== id);
}

function isMsg(value: unknown): value is Msg {
  const m = value as Msg;
  return !!m && typeof m.id === 'string' && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string';
}

/** Lee lo guardado con cuidado: si algo está dañado se descarta, sin romper la pantalla. */
export function parseConversations(raw: string | null): Conversation[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (c): c is Conversation =>
          !!c && typeof c.id === 'string' && typeof c.title === 'string' && typeof c.updatedAt === 'number' &&
          Array.isArray(c.messages) && c.messages.every(isMsg),
      )
      .slice(0, MAX_CONVERSATIONS);
  } catch {
    return [];
  }
}

export async function loadConversations(userId: string): Promise<Conversation[]> {
  try {
    return parseConversations(await AsyncStorage.getItem(chatsKey(userId)));
  } catch {
    return [];
  }
}

export async function saveConversations(userId: string, list: Conversation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(chatsKey(userId), JSON.stringify(list));
  } catch {
    // Si no se puede guardar, el chat sigue funcionando; solo no queda en el historial.
  }
}

/** ¿El usuario quiere que Nutty use sus tarjetas y movimientos? Por defecto sí (se le avisa en pantalla). */
export async function loadUseData(userId: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(prefsKey(userId));
    return raw ? JSON.parse(raw).useData !== false : true;
  } catch {
    return true;
  }
}

export async function saveUseData(userId: string, useData: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(prefsKey(userId), JSON.stringify({ useData }));
  } catch {
    // La preferencia solo se pierde al cerrar la app.
  }
}
