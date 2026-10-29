// Validaciones de los formularios. Son funciones puras (sin React): cada una
// devuelve un mensaje de error en español, o `null` si el valor es válido.
// El servidor vuelve a validar (checks de la tabla `profiles` y reglas de
// Supabase Auth); estas existen para dar respuesta inmediata al usuario.

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return 'Escribe tu correo.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'El correo no es válido.';
  return null;
}

// 3 a 24 caracteres: la base acepta hasta 30, pero el trigger de registro recorta
// a 24 para dejar espacio al sufijo si el nombre ya está tomado.
export function validateUsername(value: string): string | null {
  const username = value.trim();
  if (!username) return 'Escribe un nombre de usuario.';
  if (!/^[A-Za-z0-9_.]{3,24}$/.test(username)) {
    return 'Usa de 3 a 24 caracteres: letras, números, guion bajo o punto.';
  }
  return null;
}

export function normalizePhone(value: string): string {
  return value.replace(/[\s-]/g, '');
}

export function validatePhone(value: string): string | null {
  const phone = normalizePhone(value);
  if (!phone) return 'Escribe tu teléfono.';
  if (!/^\d{10}$/.test(phone)) return 'El teléfono debe tener 10 dígitos.';
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Escribe una contraseña.';
  if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  return null;
}

export function validatePasswordConfirmation(password: string, confirmation: string): string | null {
  if (!confirmation) return 'Repite tu contraseña.';
  if (password !== confirmation) return 'Las contraseñas no coinciden.';
  return null;
}

/** Va poniendo las diagonales mientras se escribe: "01012000" -> "01/01/2000". */
export function formatBirthDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export type BirthDateResult = { iso: string; error: null } | { iso: null; error: string };

/**
 * Convierte "DD/MM/AAAA" a "AAAA-MM-DD" (el formato que guarda la base de datos).
 * `today` se puede inyectar para probar la función.
 */
export function parseBirthDate(value: string, today: Date = new Date()): BirthDateResult {
  const text = value.trim();
  if (!text) return { iso: null, error: 'Escribe tu fecha de nacimiento.' };

  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) return { iso: null, error: 'Usa el formato DD/MM/AAAA.' };

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  // Date.UTC "corrige" fechas imposibles (31/02 -> 03/03); se compara para detectarlas.
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!isRealDate || year < 1900) return { iso: null, error: 'La fecha no es válida.' };

  const pad = (n: number) => String(n).padStart(2, '0');
  const iso = `${year}-${pad(month)}-${pad(day)}`;
  const todayIso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  if (iso > todayIso) return { iso: null, error: 'La fecha no puede ser futura.' };

  return { iso, error: null };
}

/** "2000-05-01" -> "01/05/2000" (sin pasar por Date para evitar corrimientos de zona horaria). */
export function formatIsoDate(iso: string | null): string {
  if (!iso) return '—';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}
