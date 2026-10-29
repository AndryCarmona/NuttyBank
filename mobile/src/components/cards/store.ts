import { savingsDate } from './savings-utils';
import { useEffect, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
export type Card = { id: string; bank: string; type: 'Débito' | 'Crédito'; limit: number; balance: number };
export type Entry = { id: string; date: string; category: string; amount: number; concept: string; note: string; source: string; kind: 'Gasto' | 'Ingreso' };
export type Goal = { id: string; name: string; target: number; saved: number; category?: string; deadline?: string; initialSaved?: number; contributions?: { id: string; amount: number; date: string; concept: string; note: string }[] };
export const initialCategories = ['Comida', 'Transporte', 'Salud', 'Supermercado', 'Alquiler', 'Regalos', 'Ahorros', 'Ocio'];
let state: { cards: Card[]; categories: string[]; entries: Entry[]; goals: Goal[]; ready: boolean; storageError: string } = { ready: false, storageError: '', cards: [], categories: initialCategories, entries: [], goals: [] };
const initialState = state;
const listeners = new Set<() => void>();
// Los datos viven en el teléfono, separados por usuario: cada cuenta usa su propia clave.
// Sin usuario (sesión cerrada) no se lee ni se escribe nada.
const storageKeyFor = (userId: string) => `nuttybank-accounts-v1:${userId}`;
let currentUser: string | null = null;
let loading: Promise<void> | undefined;
let saves = Promise.resolve();
function notify() { listeners.forEach(fn => fn()); }
function load() {
  const userId = currentUser;
  if (!userId || loading) return;
  const pending: Promise<void> = AsyncStorage.getItem(storageKeyFor(userId)).then(raw => {
    if (userId !== currentUser) return; // cambió la sesión mientras se leía
    if (raw) { const saved = JSON.parse(raw); if (!Array.isArray(saved.cards) || !Array.isArray(saved.entries) || !Array.isArray(saved.categories) || !Array.isArray(saved.goals)) throw Error('Invalid saved data'); state = { ...saved, ready: true, storageError: '' }; }
    else state = { ...state, ready: true };
    notify();
  }).catch(() => { if (userId !== currentUser) return; state = { ...state, ready: true, storageError: 'No se pudieron cargar los datos guardados. Reinicia la app para intentarlo de nuevo.' }; notify(); });
  loading = pending;
}
// Se llama al iniciar o cerrar sesión: descarta los datos del usuario anterior (solo en memoria)
// y carga los del nuevo. Evita que una cuenta vea las tarjetas de otra en el mismo teléfono.
export function setStorageUser(userId: string | null) {
  if (userId === currentUser) return;
  currentUser = userId;
  loading = undefined;
  state = initialState;
  notify();
  load();
}
function update(next: typeof state) {
  const userId = currentUser;
  if (!userId) throw Error('Inicia sesión para guardar tus datos.');
  state = next; notify();
  const snapshot = JSON.stringify(next);
  saves = saves.then(() => AsyncStorage.setItem(storageKeyFor(userId), snapshot)).catch(() => { state = { ...state, storageError: 'No se pudo guardar en el dispositivo. Mantén la app abierta e inténtalo nuevamente.' }; notify(); });
}
export function useAccounts() { useEffect(load, []); return useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => state, () => state); }
export function addCard(card: Omit<Card, 'id'>) { const id = `${Date.now()}-${Math.random()}`; update({ ...state, cards: [...state.cards, { ...card, id }] }); return id; }
export function addCategory(name: string) { if (state.categories.some(c => c.toLocaleLowerCase() === name.toLocaleLowerCase())) throw Error('Esta categoría ya existe.'); update({ ...state, categories: [...state.categories, name] }); }
export function addEntry(entry: Omit<Entry, 'id'>) {
  const card = state.cards.find(c => c.id === entry.source);
  if (entry.source !== 'cash' && !card) throw Error('Selecciona una tarjeta válida.');
  const delta = entry.kind === 'Gasto' ? -entry.amount : entry.amount;
  if (card && card.type === 'Débito' && card.balance + delta < 0) throw Error('El gasto supera el saldo disponible.');
  if (card && card.type === 'Crédito' && (card.balance - delta > card.limit || card.balance - delta < 0)) throw Error('El movimiento supera el límite o el importe de la deuda.');
  update({ ...state, entries: [{ ...entry, id: `${Date.now()}-${Math.random()}` }, ...state.entries], cards: state.cards.map(c => c.id !== entry.source ? c : { ...c, balance: c.balance + (c.type === 'Débito' ? delta : -delta) }) });
}
export function addGoal(name: string, target: number, initialSaved = 0, deadline?: string, category = name) {
  if (!name.trim() || !category.trim()) throw Error('Escribe la categoría de tu ahorro.');
  if (!Number.isFinite(target) || target <= 0 || !Number.isFinite(initialSaved) || initialSaved < 0) throw Error('Revisa la meta y el monto inicial.');
  if (deadline && (!savingsDate(deadline) || deadline < localDate())) throw Error('La fecha final debe ser hoy o una fecha futura.');
  const id = String(Date.now()) + '-' + Math.random();
  update({ ...state, goals: [...state.goals, { id, name: name.trim(), category: category.trim(), target: Math.round(target * 100) / 100, saved: Math.round(initialSaved * 100) / 100, initialSaved: Math.round(initialSaved * 100) / 100, deadline, contributions: [] }] });
  return id;
}
export function contribute(id: string, amount: number, date: string, concept: string, note: string) {
  if (!state.goals.some(g => g.id === id)) throw Error('Este ahorro ya no está disponible.');
  if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) < 1) throw Error('Ingresa un importe positivo.');
  if (!savingsDate(date) || date > localDate()) throw Error('Selecciona una fecha válida, hasta hoy.');
  if (!concept.trim()) throw Error('Escribe el concepto de la aportación.');
  const rounded = Math.round(amount * 100) / 100;
  update({ ...state, goals: state.goals.map(g => g.id === id ? { ...g, saved: Math.round((g.saved + rounded) * 100) / 100, contributions: [{ id: String(Date.now()) + '-' + Math.random(), amount: rounded, date, concept: concept.trim(), note: note.trim() }, ...(g.contributions ?? [])] } : g) });
}
export function localDate() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
