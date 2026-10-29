import type { FinanceContext } from '@/lib/api';

/** Lo que se necesita de los datos guardados en el teléfono (ver components/cards/store.ts). */
type Accounts = {
  cards: { id: string; bank: string; type: 'Débito' | 'Crédito'; limit: number; balance: number }[];
  entries: { date: string; category: string; amount: number; concept: string; source: string; kind: 'Gasto' | 'Ingreso' }[];
  goals: { name: string; target: number; saved: number }[];
};

export const PERIOD_DAYS = 90;
/** Un gasto de este monto (en pesos) o menos se considera "hormiga". */
export const SMALL_THRESHOLD = 150;

const round = (n: number) => Math.round(n * 100) / 100;
const text = (value: string, fallback: string, max = 40) => value.trim().replace(/\s+/g, ' ').slice(0, max) || fallback;

function isoDaysAgo(now: Date, days: number): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function spend(expenses: { amount: number }[]) {
  const small = expenses.filter((e) => e.amount <= SMALL_THRESHOLD);
  return {
    expenses_total: round(expenses.reduce((sum, e) => sum + e.amount, 0)),
    expenses_count: expenses.length,
    small_expenses_total: round(small.reduce((sum, e) => sum + e.amount, 0)),
    small_expenses_count: small.length,
  };
}

/**
 * Resume tarjetas, ingresos, gastos y metas de los últimos 90 días para que Nutty pueda responder
 * con datos reales (por ejemplo, en qué tarjeta hay más gastos hormiga). Solo se mandan totales y
 * conteos: nunca números de tarjeta ni notas.
 */
export function buildFinanceContext(data: Accounts, now: Date = new Date()): FinanceContext {
  const since = isoDaysAgo(now, PERIOD_DAYS);
  const entries = data.entries.filter((e) => e.date >= since && Number.isFinite(e.amount) && e.amount >= 0);
  const expenses = entries.filter((e) => e.kind === 'Gasto');
  const bankOf = (source: string) => {
    const card = data.cards.find((c) => c.id === source);
    return card ? text(card.bank, 'Tarjeta') : 'Efectivo';
  };

  const cards = data.cards.slice(0, 10).map((card) => ({
    bank: text(card.bank, 'Tarjeta'),
    kind: card.type,
    balance: round(Math.max(0, card.balance)),
    limit: round(Math.max(0, card.limit)),
    ...spend(expenses.filter((e) => e.source === card.id)),
  }));

  const cashExpenses = expenses.filter((e) => e.source === 'cash');
  const cash = cashExpenses.length ? spend(cashExpenses) : null;

  const byCategory = new Map<string, { total: number; count: number }>();
  for (const e of expenses) {
    const key = text(e.category, 'Sin categoría');
    const row = byCategory.get(key) ?? { total: 0, count: 0 };
    row.total += e.amount;
    row.count += 1;
    byCategory.set(key, row);
  }
  const categories = [...byCategory.entries()]
    .map(([category, v]) => ({ category, total: round(v.total), count: v.count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

  // Gastos pequeños que se repiten (mismo concepto y mismo medio de pago, 2 veces o más).
  const repeated = new Map<string, { concept: string; category: string; source: string; count: number; total: number }>();
  for (const e of expenses.filter((x) => x.amount <= SMALL_THRESHOLD)) {
    const concept = text(e.concept, text(e.category, 'Sin concepto'));
    const source = bankOf(e.source);
    const key = `${concept.toLocaleLowerCase()}|${source}`;
    const row = repeated.get(key) ?? { concept, category: text(e.category, 'Sin categoría'), source, count: 0, total: 0 };
    row.count += 1;
    row.total += e.amount;
    repeated.set(key, row);
  }
  const repeated_small = [...repeated.values()]
    .filter((r) => r.count >= 2)
    .map((r) => ({ ...r, total: round(r.total) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

  return {
    period_days: PERIOD_DAYS,
    small_threshold: SMALL_THRESHOLD,
    income_total: round(entries.filter((e) => e.kind === 'Ingreso').reduce((sum, e) => sum + e.amount, 0)),
    expenses_total: round(expenses.reduce((sum, e) => sum + e.amount, 0)),
    cards,
    cash,
    categories,
    repeated_small,
    goals: data.goals.slice(0, 8).map((g) => ({ name: text(g.name, 'Meta'), target: round(g.target), saved: round(g.saved) })),
  };
}
