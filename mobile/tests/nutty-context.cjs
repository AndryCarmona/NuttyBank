const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const code = ts.transpileModule(fs.readFileSync('src/components/nutty/context.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const context = { exports: {}, require: () => ({}), Math, Number, Map, Date, String };
vm.runInNewContext(code, context);
// Se pasa por JSON para comparar datos puros (los objetos del sandbox de vm tienen otros prototipos).
const build = (...args) => JSON.parse(JSON.stringify(context.exports.buildFinanceContext(...args)));

const now = new Date(2026, 9, 29); // 29 oct 2026
const cards = [
  { id: 'bbva', bank: 'BBVA', type: 'Débito', limit: 0, balance: 950 },
  { id: 'nu', bank: 'Nu', type: 'Crédito', limit: 5000, balance: 500 },
];
const e = (date, amount, concept, source, kind = 'Gasto', category = 'Comida') => ({ date, amount, concept, source, kind, category });
const entries = [
  e('2026-10-28', 45, 'Café', 'bbva'), e('2026-10-27', 45, 'café ', 'bbva'), e('2026-10-20', 50, 'Café', 'bbva'),
  e('2026-10-25', 30, 'Refresco', 'cash'), e('2026-10-26', 30, 'Refresco', 'cash'),
  e('2026-10-15', 674.4, 'Renta', 'bbva', 'Gasto', 'Alquiler'),
  e('2026-10-10', 4000, 'Sueldo', 'bbva', 'Ingreso', 'Ahorros'),
  e('2026-10-12', 80, 'Uber', 'nu', 'Gasto', 'Transporte'),
  e('2026-01-01', 999, 'Viejo', 'bbva'), // fuera de los 90 días
];
const goals = [{ name: 'Viaje', target: 20000, saved: 100 }];
const ctx = build({ cards, entries, goals }, now);

assert.equal(ctx.period_days, 90);
assert.equal(ctx.income_total, 4000);
assert.equal(ctx.expenses_total, 45 + 45 + 50 + 30 + 30 + 674.4 + 80); // sin el gasto de enero
const bbva = ctx.cards.find((c) => c.bank === 'BBVA');
assert.deepEqual([bbva.expenses_count, bbva.small_expenses_count, bbva.small_expenses_total], [4, 3, 140]);
assert.equal(bbva.kind, 'Débito'); assert.equal(bbva.balance, 950);
const nu = ctx.cards.find((c) => c.bank === 'Nu');
assert.deepEqual([nu.kind, nu.balance, nu.limit, nu.small_expenses_count], ['Crédito', 500, 5000, 1]);
assert.deepEqual([ctx.cash.expenses_count, ctx.cash.small_expenses_total], [2, 60]);
assert.equal(ctx.categories[0].category, 'Alquiler'); // la categoría con más gasto va primero
// "Café" y "café " (con espacio y minúscula) son el mismo concepto; "Uber" una sola vez no se repite.
const rep = ctx.repeated_small.map((r) => `${r.concept}|${r.source}|${r.count}|${r.total}`);
assert.deepEqual(rep, ['Café|BBVA|3|140', 'Refresco|Efectivo|2|60']);
assert.deepEqual(ctx.goals, [{ name: 'Viaje', target: 20000, saved: 100 }]);

// Sin datos: no truena y manda un resumen vacío.
const empty = build({ cards: [], entries: [], goals: [] }, now);
assert.deepEqual([empty.cards.length, empty.cash, empty.income_total, empty.repeated_small.length], [0, null, 0, 0]);

// Textos largos o vacíos se acomodan a lo que acepta el servidor (1 a 40 caracteres).
const raro = build({ cards: [{ id: 'x', bank: ' ', type: 'Débito', limit: 0, balance: -5 }],
  entries: [e('2026-10-28', 10, 'x'.repeat(100), 'x'), e('2026-10-28', 10, 'x'.repeat(100), 'x')], goals: [] }, now);
assert.equal(raro.cards[0].bank, 'Tarjeta'); assert.equal(raro.cards[0].balance, 0);
assert.equal(raro.repeated_small[0].concept.length, 40);
// Color, días de corte/pago y NIP nunca viajan a Nutty ni al backend.
const secretos = build({ cards: [{ id: 'z', bank: 'Banco Z', type: 'Crédito', limit: 1000, balance: 100, color: '#B6D4F2', cutDay: 15, payDay: 5, hasPin: true, pin: '4321' }],
  entries: [e('2026-10-28', 10, 'Café', 'z')], goals: [] }, now);
const texto = JSON.stringify(secretos);
assert(!/4321|pin|color|cutDay|payDay|#B6D4F2/i.test(texto), 'datos privados de la tarjeta en el contexto: ' + texto);
console.log('OK: resumen de finanzas para Nutty (ventana de 90 días, hormiga, tarjetas, efectivo y límites de texto).');
