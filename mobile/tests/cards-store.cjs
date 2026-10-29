const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const saved = new Map();
const code = ts.transpileModule(fs.readFileSync('src/components/cards/store.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = { exports: {}, require: name => {
  if (name === 'react') return { useEffect: fn => fn(), useSyncExternalStore: (_, get) => get() };
  if (name === '@react-native-async-storage/async-storage') return { __esModule: true, default: { getItem: async key => saved.get(key) ?? null, setItem: async (key, value) => { saved.set(key, value); } } };
  throw Error(name);
}, Date, Math, Set, Promise };
vm.runInNewContext(code, context);
const store = context.exports;
(async () => {
  store.setStorageUser('user-a'); store.useAccounts(); await new Promise(resolve => setImmediate(resolve));
  const debit = store.addCard({ bank: 'Banco A', type: 'Débito', balance: 1000, limit: 0 });
  const credit = store.addCard({ bank: 'Banco B', type: 'Crédito', balance: 100, limit: 500 });
  const entry = { date: '2026-10-29', category: 'Comida', amount: 50, concept: 'Cena', note: '', kind: 'Gasto' };
  store.addEntry({ ...entry, source: debit });
  store.addEntry({ ...entry, source: credit });
  store.addEntry({ ...entry, source: 'cash' });
  let state = store.useAccounts();
  assert.equal(state.cards.find(c => c.id === debit).balance, 950);
  assert.equal(state.cards.find(c => c.id === credit).balance, 150);
  assert.equal(state.entries.reduce((sum, e) => sum + e.amount, 0), 150);
  assert.throws(() => store.addEntry({ ...entry, source: debit, amount: 1000 }));
  assert.throws(() => store.addEntry({ ...entry, source: credit, amount: 400 }));
  assert.throws(() => store.addEntry({ ...entry, source: 'missing' }));
  assert.equal(store.useAccounts().entries.length, 3);
  store.addEntry({ ...entry, source: debit, kind: 'Ingreso', amount: 200 });
  assert.equal(store.useAccounts().cards.find(c => c.id === debit).balance, 1150);
  store.addCategory('Mascotas');
  assert.throws(() => store.addCategory('mascotas'));
  store.contribute('travel', 100, '2026-10-29', 'Aportación', '');
  assert.equal(store.useAccounts().goals[0].saved, 100);
  assert.equal(store.useAccounts().goals[0].contributions.length, 1);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(JSON.parse(saved.get('nuttybank-accounts-v1:user-a')).entries.length, 4);
  // Aislamiento: otra cuenta en el mismo teléfono no ve nada de user-a.
  store.setStorageUser('user-b'); await new Promise(resolve => setImmediate(resolve));
  assert.equal(store.useAccounts().cards.length, 0);
  assert.equal(store.useAccounts().entries.length, 0);
  store.addCard({ bank: 'Banco B', type: 'Débito', balance: 10, limit: 0 });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(JSON.parse(saved.get('nuttybank-accounts-v1:user-a')).cards.length, 2);
  assert.equal(JSON.parse(saved.get('nuttybank-accounts-v1:user-b')).cards.length, 1);
  // Sin sesión no se puede guardar, y al volver user-a recupera lo suyo.
  store.setStorageUser(null);
  assert.throws(() => store.addCard({ bank: 'X', type: 'Débito', balance: 1, limit: 0 }));
  store.setStorageUser('user-a'); await new Promise(resolve => setImmediate(resolve));
  assert.equal(store.useAccounts().cards.length, 2);
  assert.equal(store.useAccounts().entries.length, 4);
  console.log('OK: saldos, deuda, límites, efectivo, categorías, aportaciones, persistencia y aislamiento por usuario.');
})().catch(error => { console.error(error); process.exitCode = 1; });

