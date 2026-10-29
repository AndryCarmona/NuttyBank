// Llamadas al backend (FastAPI). Cada petición lleva el token de la sesión de
// Supabase en `Authorization: Bearer ...`; el backend lo valida y responde solo
// con los datos de ese usuario.
import { supabase } from '@/lib/supabase';

const TIMEOUT_MS = 10_000;
// Nutty tarda más: el servidor espera la respuesta de Gemini (hasta 30 s).
const CHAT_TIMEOUT_MS = 40_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function friendlyDetail(response: Response): Promise<string> {
  const generic = 'El servidor tuvo un problema. Inténtalo de nuevo.';
  if (![422, 429, 502, 503, 504].includes(response.status)) return generic;
  try {
    const data = (await response.json()) as { detail?: unknown };
    return typeof data.detail === 'string' && data.detail ? data.detail : generic;
  } catch {
    return generic;
  }
}

export type Me = {
  id: string;
  email: string | null;
  username: string;
  phone: string | null;
  birth_date: string | null;
};

type RequestOptions = { method?: 'GET' | 'POST'; body?: unknown; timeoutMs?: number };

async function apiFetch<T>(path: string, { method = 'GET', body, timeoutMs = TIMEOUT_MS }: RequestOptions = {}): Promise<T> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
  if (!baseUrl) {
    throw new ApiError('Falta EXPO_PUBLIC_API_URL en mobile/.env (reinicia con: npx expo start -c).');
  }

  // getSession renueva el token si ya caducó, así no se manda uno vencido.
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new ApiError('Tu sesión expiró. Inicia sesión de nuevo.', 401);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor. Revisa que el backend esté corriendo y que ' +
        'EXPO_PUBLIC_API_URL apunte a la IP de tu computadora.',
    );
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401) throw new ApiError('Tu sesión expiró. Inicia sesión de nuevo.', 401);
  if (response.status === 404) throw new ApiError('No se encontró tu perfil.', 404);
  if (!response.ok) {
    // El backend explica en español los problemas esperados (límite de mensajes, Nutty ocupado...).
    throw new ApiError(await friendlyDetail(response), response.status);
  }

  return (await response.json()) as T;
}

export function fetchMe(): Promise<Me> {
  return apiFetch<Me>('/me');
}

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

/** Manda el historial a Nutty (vía el backend, que habla con Gemini) y devuelve su respuesta. */
export async function sendChat(messages: ChatMessage[]): Promise<string> {
  const data = await apiFetch<{ reply: string }>('/chat', {
    method: 'POST',
    body: { messages },
    timeoutMs: CHAT_TIMEOUT_MS,
  });
  return data.reply;
}
