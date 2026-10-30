// Prueba del banco de preguntas de Nutty (se ejecuta con `npm test`).
const fs = require('fs'), vm = require('vm'), assert = require('assert'), ts = require('typescript');
const src = fs.readFileSync(__dirname + '/../src/components/nutty/questions.ts', 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: 'commonjs', target: 'es2020' } }).outputText;
const mod = { exports: {} };
vm.runInNewContext(js, { module: mod, exports: mod.exports, Math });
const { QUESTION_BANK, pickSuggestions } = mod.exports;

assert(QUESTION_BANK.length >= 24, 'el banco debe tener suficientes preguntas');
assert.strictEqual(new Set(QUESTION_BANK.map((q) => q.text)).size, QUESTION_BANK.length, 'sin preguntas repetidas');

// Siempre 3 preguntas distintas y del banco.
for (let i = 0; i < 200; i++) {
  const picked = pickSuggestions();
  assert.strictEqual(picked.length, 3);
  assert.strictEqual(new Set(picked).size, 3);
  picked.forEach((p) => assert(QUESTION_BANK.some((q) => q.text === p)));
  const topics = picked.map((p) => QUESTION_BANK.find((q) => q.text === p).topic);
  assert.strictEqual(new Set(topics).size, 3, 'temas distintos');
}

// Nueva conversación: no repite ninguna de las tres anteriores.
let previous = pickSuggestions();
for (let i = 0; i < 200; i++) {
  const next = pickSuggestions({ avoid: previous });
  next.forEach((n) => assert(!previous.includes(n), 'no repite las anteriores'));
  previous = next;
}

// Sin permiso de datos no se sugieren preguntas que los usan.
for (let i = 0; i < 100; i++) {
  pickSuggestions({ withData: false }).forEach((p) => assert(!QUESTION_BANK.find((q) => q.text === p).data));
}

// Hay variedad: en 100 conversaciones salen muchas combinaciones y preguntas distintas.
const seen = new Set(), combos = new Set();
for (let i = 0; i < 100; i++) { const p = pickSuggestions(); p.forEach((x) => seen.add(x)); combos.add([...p].sort().join('|')); }
assert(seen.size >= 20, `variedad de preguntas: ${seen.size}`);
assert(combos.size >= 50, `variedad de combinaciones: ${combos.size}`);

// Con azar fijo el resultado es determinista.
assert.deepStrictEqual(JSON.parse(JSON.stringify(pickSuggestions({ random: () => 0 }))), JSON.parse(JSON.stringify(pickSuggestions({ random: () => 0 }))));
console.log('nutty-questions: OK');
