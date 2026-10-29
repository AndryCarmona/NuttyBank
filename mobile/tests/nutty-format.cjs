const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const code = ts.transpileModule(fs.readFileSync('src/components/nutty/format.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const context = { exports: {} };
vm.runInNewContext(code, context);
const { cleanReply } = context.exports;

assert.equal(cleanReply('Ahorra **el 10%** de tu ingreso.'), 'Ahorra el 10% de tu ingreso.');
assert.equal(cleanReply('## Presupuesto\nUsa la regla 50/30/20.'), 'Presupuesto\nUsa la regla 50/30/20.');
assert.equal(cleanReply('* Necesidades\n* Gustos\n  * Ahorro'), '- Necesidades\n- Gustos\n  - Ahorro');
assert.equal(cleanReply('Un 5 * 3 = 15 es multiplicar.'), 'Un 5 * 3 = 15 es multiplicar.');
assert.equal(cleanReply('  Hola\r\n\r\n\r\n\r\nAdiós  '), 'Hola\n\nAdiós');
assert.equal(cleanReply('Usa `interés compuesto`.'), 'Usa interés compuesto.');
console.log('OK: limpieza de las respuestas de Nutty (sin Markdown).');
