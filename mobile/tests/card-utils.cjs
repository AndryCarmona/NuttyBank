const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const load = (file, extra = {}) => {
  const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(out, { module: mod, exports: mod.exports, Date, Math, Number, String, ...extra });
  return mod.exports;
};
const plain = (v) => JSON.parse(JSON.stringify(v));
const u = load('src/components/cards/card-utils.ts');

// Colores
assert.equal(u.CARD_COLORS.length, 8);
assert.equal(new Set(u.CARD_COLORS.map((c) => c.hex)).size, 8);
assert(u.CARD_COLORS.every((c) => /^#[0-9A-F]{6}$/i.test(c.hex)));
assert(u.isCardColor('#B6D4F2') && !u.isCardColor('#000000') && !u.isCardColor(5));

// Días de corte/pago
assert.deepEqual(plain(u.parseDay('')), { ok: true });
assert.deepEqual(plain(u.parseDay('  ')), { ok: true });
assert.deepEqual(plain(u.parseDay('15')), { ok: true, day: 15 });
assert.deepEqual(plain(u.parseDay('1')), { ok: true, day: 1 });
assert.deepEqual(plain(u.parseDay('31')), { ok: true, day: 31 });
for (const bad of ['0', '32', '-1', '1.5', 'ab', '100', '3 1']) assert.equal(u.parseDay(bad).ok, false, bad);

// Próxima fecha
const at = (y, m, d) => new Date(y, m - 1, d, 15, 30);
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
let n = u.nextOccurrence(15, at(2026, 10, 30));
assert.equal(iso(n.date), '2026-11-15'); assert.equal(n.daysLeft, 16);
n = u.nextOccurrence(30, at(2026, 10, 30));
assert.equal(iso(n.date), '2026-10-30'); assert.equal(n.daysLeft, 0); // hoy cuenta como hoy
n = u.nextOccurrence(31, at(2026, 11, 5));
assert.equal(iso(n.date), '2026-11-30'); // noviembre no tiene 31: último día
n = u.nextOccurrence(30, at(2027, 1, 31));
assert.equal(iso(n.date), '2027-02-28'); assert.equal(n.daysLeft, 28); // pasa a febrero (28 días)
n = u.nextOccurrence(5, at(2026, 12, 20));
assert.equal(iso(n.date), '2027-01-05'); // cambio de año
n = u.nextOccurrence(29, at(2028, 2, 10));
assert.equal(iso(n.date), '2028-02-29'); // año bisiesto
assert.equal(u.daysLabel(0), 'hoy'); assert.equal(u.daysLabel(1), 'mañana'); assert.equal(u.daysLabel(7), 'en 7 días');

// NIP
for (const ok of ['1234', '12345', '123456', '0000']) assert(u.validPin(ok), ok);
for (const bad of ['', '123', '1234567', '12a4', ' 1234', '12 34', '１２３４']) assert(!u.validPin(bad), bad);
assert(/opcional/.test(u.PIN_NOTICE) && /CVV/.test(u.PIN_NOTICE) && /no se envía/.test(u.PIN_NOTICE) && /almacén seguro/.test(u.PIN_NOTICE));

// --- pin-store con un almacén seguro falso ---
const vault = new Map();
const secure = {
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'unlocked-this-device',
  calls: [],
  async setItemAsync(k, v, o) { assert(/^[A-Za-z0-9._-]+$/.test(k), `clave inválida: ${k}`); secure.calls.push(o); vault.set(k, v); },
  async getItemAsync(k) { assert(/^[A-Za-z0-9._-]+$/.test(k)); return vault.has(k) ? vault.get(k) : null; },
  async deleteItemAsync(k) { vault.delete(k); },
};
const mk = (os) => load('src/components/cards/pin-store.ts', {
  require: (name) => name === 'expo-secure-store' ? secure : name === 'react-native' ? { Platform: { OS: os } } : name === './card-utils' ? u : (() => { throw Error(name); })(),
});
(async () => {
  const p = mk('android');
  assert.equal(p.pinSupported, true);
  const card = '1730000000000-0.123456789';
  await p.savePin('user-1', card, '4321');
  assert.equal(await p.readPin('user-1', card), '4321');
  assert.equal(secure.calls[0].keychainAccessible, 'unlocked-this-device'); // solo en este dispositivo
  assert.equal(await p.readPin('user-2', card), null, 'otro usuario no ve el NIP');
  assert.equal(await p.readPin('user-1', 'otra-tarjeta'), null, 'otra tarjeta no ve el NIP');
  await p.savePin('user-1', card, '987654'); // cambiar
  assert.equal(await p.readPin('user-1', card), '987654');
  await assert.rejects(() => p.savePin('user-1', card, '12'), /4 a 6 dígitos/);
  await assert.rejects(() => p.savePin('user-1', card, 'abcd'), /4 a 6 dígitos/);
  await assert.rejects(() => p.savePin(null, card, '1234'), /Inicia sesión/);
  assert.equal(await p.readPin('user-1', card), '987654', 'un intento fallido no cambia el NIP');
  await p.deletePin('user-1', card);
  assert.equal(await p.readPin('user-1', card), null);
  // Web: no se guarda nada.
  const w = mk('web');
  assert.equal(w.pinSupported, false);
  await assert.rejects(() => w.savePin('user-1', card, '1234'), /solo se puede guardar en la app del teléfono/);
  assert.equal(vault.size, 0);
  console.log('OK: colores, días de corte/pago, próxima fecha, validación y almacenamiento seguro del NIP.');
})().catch((e) => { console.error(e); process.exit(1); });
