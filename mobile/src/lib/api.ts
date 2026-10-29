// Llamadas al backend (FastAPI). Cada petición lleva el token de la sesión de
// Supabase en `Authorization: Bearer ...`; el backend lo valida y responde solo
// con los datos de ese usuario.
import { supabase } from '@/lib/supabase';

const TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type Me = {
  id: string;
  email: string | null;
  username: string;
  phone: string | null;
  birth_date: string | null;
};

async function apiFetch<T>(path: string): Promise<T> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
  if (!baseUrl) {
    throw new ApiError('Falta EXPO_PUBLIC_API_URL en mobile/.env (reinicia con: npx expo start -c).');
  }

  // getSession renueva el token si ya caducó, así no se manda uno vencido.
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new ApiError('Tu sesión expiró. Inicia sesión de nuevo.', 401);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
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
    throw new ApiError('El servidor tuvo un problema. Inténtalo de nuevo.', response.status);
  }

  return (await response.json()) as T;
}

export function fetchMe(): Promise<Me> {
  return apiFetch<Me>('/me');
}
