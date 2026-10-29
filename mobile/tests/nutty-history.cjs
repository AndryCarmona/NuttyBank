const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const code = ts.transpileModule(fs.readFileSync('src/components/nutty/history.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const store = new Map();
const context = {
  exports: {},
  require: () => ({ __esModule: true, default: { getItem: async (k) => store.get(k) ?? null, setItem: async (k, v) => { store.set(k, v); } } }),
  JSON, Array, Math, Promise,
};
vm.runInNewContext(code, context);
const h = context.exports;
const j = (v) => JSON.parse(JSON.stringify(v)); // datos puros (los objetos de vm tienen otros prototipos)
const u = (id, content) => ({ id, role: 'user', content });
const n = (id, content) => ({ id, role: 'assistant', content });

(async () => {
  // Título y conversaciones vacías
  assert.equal(h.titleFor([u('1', '  ¿Cómo   empiezo a ahorrar?  ')]), '¿Cómo empiezo a ahorrar?');
  assert.equal(h.titleFor([u('1', 'x'.repeat(80))]).length, 40);
  assert.equal(h.titleFor([]), 'Conversación nueva');
  assert.deepEqual(j(h.upsertConversation([], 'a', [n('1', 'Hola')], 1)), []);

  // Guardar, actualizar sin duplicar y ordenar por fecha
  let list = j(h.upsertConversation([], 'a', [u('1', 'uno')], 100));
  list = j(h.upsertConversation(list, 'b', [u('1', 'dos')], 200));
  assert.deepEqual(list.map((c) => c.id), ['b', 'a']);
  list = j(h.upsertConversation(list, 'a', [u('1', 'uno'), n('2', 'resp')], 300));
  assert.deepEqual(list.map((c) => c.id), ['a', 'b']);
  assert.equal(list[0].messages.length, 2);
  assert.deepEqual(j(h.removeConversation(list, 'a')).map((c) => c.id), ['b']);

  // Límites
  let many = [];
  for (let i = 0; i < 40; i++) many = j(h.upsertConversation(many, `c${i}`, [u('1', `p${i}`)], i));
  assert.equal(many.length, 30);
  assert.equal(many[0].id, 'c39');
  const long = Array.from({ length: 150 }, (_, i) => u(`m${i}`, 'x'));
  assert.equal(j(h.upsertConversation([], 'z', long, 1))[0].messages.length, 100);

  // Datos dañados no rompen nada
  assert.deepEqual(j(h.parseConversations('no es json')), []);
  assert.deepEqual(j(h.parseConversations('{"a":1}')), []);
  assert.deepEqual(j(h.parseConversations(JSON.stringify([{ id: 'x' }, list[0]]))).map((c) => c.id), ['a']);

  // Guardado separado por usuario + preferencia
  await h.saveConversations('user-a', list);
  assert.equal(j(await h.loadConversations('user-a')).length, 2);
  assert.deepEqual(j(await h.loadConversations('user-b')), []);
  assert.equal(await h.loadUseData('user-a'), true);
  await h.saveUseData('user-a', false);
  assert.equal(await h.loadUseData('user-a'), false);
  assert.equal(await h.loadUseData('user-b'), true);
  console.log('OK: historial de Nutty (guardar, ordenar, límites, datos dañados y separación por usuario).');
})().catch((e) => { console.error(e); process.exitCode = 1; });
