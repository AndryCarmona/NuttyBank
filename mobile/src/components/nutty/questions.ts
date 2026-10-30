// Banco de preguntas que Nutty sugiere al empezar una conversación nueva.
// Cada pregunta tiene un tema; al elegir 3 se procura que sean de temas distintos.
// Las que dependen de los datos del usuario (tarjetas, movimientos, ahorros) llevan
// `data: true` y no se sugieren si el usuario apagó "usar mis datos".
export type SuggestedQuestion = { text: string; topic: string; data?: boolean };

export const QUESTION_BANK: SuggestedQuestion[] = [
  // Ahorro
  { topic: 'ahorro', text: '¿Cómo empiezo a ahorrar si gano poco?' },
  { topic: 'ahorro', text: '¿Cuánto debería tener en mi fondo de emergencia?' },
  { topic: 'ahorro', text: '¿Qué es mejor: ahorrar primero o gastar primero?' },
  { topic: 'ahorro', text: '¿Cómo puedo cumplir una meta de ahorro más rápido?', data: true },
  { topic: 'ahorro', text: '¿Qué es el ahorro automático y cómo lo uso?' },
  // Presupuesto
  { topic: 'presupuesto', text: '¿Qué es la regla 50/30/20?' },
  { topic: 'presupuesto', text: '¿Cómo armo un presupuesto mensual paso a paso?' },
  { topic: 'presupuesto', text: '¿Qué diferencia hay entre gastos fijos y variables?' },
  { topic: 'presupuesto', text: '¿En qué categoría estoy gastando más este mes?', data: true },
  { topic: 'presupuesto', text: '¿Cómo van mis ingresos contra mis gastos?', data: true },
  // Gastos hormiga
  { topic: 'hormiga', text: '¿Qué son los gastos hormiga?' },
  { topic: 'hormiga', text: '¿En qué tarjeta tengo más gastos hormiga?', data: true },
  { topic: 'hormiga', text: '¿Cuánto me cuestan al año mis gastos pequeños?', data: true },
  { topic: 'hormiga', text: '¿Cómo reduzco mis gastos hormiga sin sentir que me privo de todo?' },
  // Tarjetas y crédito
  { topic: 'tarjetas', text: '¿Cuál es la diferencia entre tarjeta de débito y de crédito?' },
  { topic: 'tarjetas', text: '¿Qué es la fecha de corte y la fecha de pago?' },
  { topic: 'tarjetas', text: '¿Por qué conviene pagar más del pago mínimo?' },
  { topic: 'tarjetas', text: '¿Cómo uso mi tarjeta de crédito sin endeudarme?' },
  { topic: 'tarjetas', text: '¿Cuál de mis tarjetas usa más de su límite?', data: true },
  // Interés e inflación
  { topic: 'interes', text: '¿Qué es el interés?' },
  { topic: 'interes', text: '¿Qué es el interés compuesto y por qué importa?' },
  { topic: 'interes', text: '¿Qué es la inflación y cómo afecta mi dinero?' },
  { topic: 'interes', text: '¿Qué significa CAT y por qué debo revisarlo?' },
  // Deudas
  { topic: 'deudas', text: '¿Cómo salgo de una deuda más rápido?' },
  { topic: 'deudas', text: '¿Qué es mejor: pagar la deuda más grande o la más cara?' },
  { topic: 'deudas', text: '¿Qué es el historial crediticio y cómo lo cuido?' },
  // Inversión y metas
  { topic: 'inversion', text: '¿Qué es invertir y en qué se diferencia de ahorrar?' },
  { topic: 'inversion', text: '¿Qué son los CETES y cómo funcionan?' },
  { topic: 'inversion', text: '¿Qué significa diversificar?' },
  // Hábitos y seguridad
  { topic: 'habitos', text: '¿Cómo distingo un gusto de una necesidad?' },
  { topic: 'habitos', text: '¿Qué hábitos financieros puedo empezar hoy?' },
  { topic: 'habitos', text: '¿Cómo hablo de dinero con mi familia o mi pareja?' },
  { topic: 'seguridad', text: '¿Cómo protejo mis tarjetas de fraudes?' },
  { topic: 'seguridad', text: '¿Qué hago si no reconozco un cargo en mi tarjeta?' },
];

type PickOptions = {
  count?: number;
  /** Incluir las preguntas que usan los datos del usuario. */
  withData?: boolean;
  /** Preguntas (texto) que no deben repetirse, p. ej. las de la conversación anterior. */
  avoid?: string[];
  /** Fuente de azar (0 ≤ n < 1); se puede cambiar para pruebas. */
  random?: () => number;
};

function shuffle<T>(items: T[], random: () => number): T[] {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/** Elige `count` preguntas distintas del banco, de temas distintos mientras sea posible. */
export function pickSuggestions({ count = 3, withData = true, avoid = [], random = Math.random }: PickOptions = {}): string[] {
  const pool = QUESTION_BANK.filter((q) => withData || !q.data);
  const fresh = pool.filter((q) => !avoid.includes(q.text));
  const ordered = shuffle(fresh.length >= count ? fresh : pool, random);
  const chosen: SuggestedQuestion[] = [];
  const topics = new Set<string>();
  for (const q of ordered) {
    if (chosen.length === count) break;
    if (!topics.has(q.topic)) {
      chosen.push(q);
      topics.add(q.topic);
    }
  }
  for (const q of ordered) {
    if (chosen.length === count) break;
    if (!chosen.includes(q)) chosen.push(q);
  }
  return chosen.map((q) => q.text);
}
