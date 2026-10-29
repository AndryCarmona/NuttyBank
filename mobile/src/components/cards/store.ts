import { useEffect, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
export type Card = { id: string; bank: string; type: 'Débito' | 'Crédito'; limit: number; balance: number };
export type Entry = { id: string; date: string; category: string; amount: number; concept: string; note: string; source: string; kind: 'Gasto' | 'Ingreso' };
export type Goal = { id: string; name: string; target: number; saved: number; contributions?: { id: string; amount: number; date: string; concept: string; note: string }[] };
export const initialCategories = ['Comida', 'Transporte', 'Salud', 'Supermercado', 'Alquiler', 'Regalos', 'Ahorros', 'Ocio'];
let state: { cards: Card[]; categories: string[]; entries: Entry[]; goals: Goal[]; ready: boolean; storageError: string } = { ready: false, storageError: '', cards: [], categories: initialCategories, entries: [], goals: [{ id: 'travel', name: 'Viaje', target: 20000, saved: 0 }, { id: 'house', name: 'Nueva casa', target: 200000, saved: 0 }, { id: 'car', name: 'Coche', target: 100000, saved: 0 }, { id: 'wedding', name: 'Boda', target: 50000, saved: 0 }] };
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
export function addGoal(name: string, target: number) { update({ ...state, goals: [...state.goals, { id: `${Date.now()}`, name, target, saved: 0 }] }); }
export function contribute(id: string, amount: number, date: string, concept: string, note: string) { update({ ...state, goals: state.goals.map(g => g.id === id ? { ...g, saved: g.saved + amount, contributions: [{ id: String(Date.now()), amount, date, concept, note }, ...(g.contributions ?? [])] } : g) }); }
export function localDate() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
