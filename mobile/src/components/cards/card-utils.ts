// Utilidades de tarjetas: colores, días de corte/pago y validación del NIP. Sin dependencias de la app.

/** Colores que se pueden elegir para una tarjeta (tonos suaves: el texto oscuro se lee bien sobre todos). */
export const CARD_COLORS = [
  { id: 'verde', label: 'Verde', hex: '#BFD8B4' },
  { id: 'azul', label: 'Azul', hex: '#B6D4F2' },
  { id: 'morado', label: 'Morado', hex: '#D2C4F0' },
  { id: 'rosa', label: 'Rosa', hex: '#F5C2D6' },
  { id: 'naranja', label: 'Naranja', hex: '#F8D0A0' },
  { id: 'rojo', label: 'Rojo', hex: '#F2B5B0' },
  { id: 'amarillo', label: 'Amarillo', hex: '#F1E4A3' },
  { id: 'turquesa', label: 'Turquesa', hex: '#A9E0D9' },
] as const;

export const isCardColor = (hex: unknown): hex is string => typeof hex === 'string' && CARD_COLORS.some(color => color.hex === hex);

/** Día del mes (1 a 31) escrito por el usuario. Vacío es válido (campo opcional) y devuelve `undefined`. */
export function parseDay(value: string): { ok: boolean; day?: number } {
  const text = value.trim();
  if (!text) return { ok: true };
  if (!/^\d{1,2}$/.test(text)) return { ok: false };
  const day = Number(text);
  return day >= 1 && day <= 31 ? { ok: true, day } : { ok: false };
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Próxima vez que cae ese día del mes (si el mes no tiene ese día, se usa el último). Hoy cuenta como hoy. */
export function nextOccurrence(day: number, today = new Date()): { date: Date; daysLeft: number } {
  const base = startOfDay(today);
  const inMonth = (year: number, month: number) => new Date(year, month, Math.min(day, new Date(year, month + 1, 0).getDate()));
  let date = inMonth(base.getFullYear(), base.getMonth());
  if (date < base) date = inMonth(base.getFullYear(), base.getMonth() + 1);
  return { date, daysLeft: Math.round((date.getTime() - base.getTime()) / 86400000) };
}

/** Texto corto: "hoy", "mañana" o "en 5 días". */
export function daysLabel(daysLeft: number) {
  return daysLeft === 0 ? 'hoy' : daysLeft === 1 ? 'mañana' : `en ${daysLeft} días`;
}

/** El NIP de una tarjeta tiene de 4 a 6 dígitos. */
export const validPin = (pin: string) => /^\d{4,6}$/.test(pin);

/** Aviso que se muestra siempre que se pide el NIP. */
export const PIN_NOTICE =
  'Es opcional y no pedimos más datos de tu tarjeta (ni número completo, ni CVV, ni vencimiento). ' +
  'Guardas el NIP solo para consultarlo aquí, más fácil que entrar a la app de tu banco. ' +
  'Se cifra con el almacén seguro de tu teléfono y no se envía a ningún servidor ni a Nutty.';
