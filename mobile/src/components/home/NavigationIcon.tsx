import { SymbolView } from 'expo-symbols';
import { View } from 'react-native';
import { colors } from './data';
const icons = {
  Puntaje: { ios: 'medal', android: 'workspace_premium', web: 'workspace_premium' },
  Fecha: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  Salud: { ios: 'pills', android: 'medication', web: 'medication' },
  Regalos: { ios: 'gift', android: 'redeem', web: 'redeem' },
  Ahorros: { ios: 'banknote', android: 'savings', web: 'savings' },
  Ocio: { ios: 'ticket', android: 'confirmation_number', web: 'confirmation_number' },
  Inicio: { ios: 'house', android: 'home', web: 'home' },
  Calendario: { ios: 'book', android: 'menu_book', web: 'menu_book' },
  Movimientos: { ios: 'creditcard', android: 'credit_card', web: 'credit_card' },
  Resumen: { ios: 'person', android: 'person', web: 'person' },
  Notificaciones: { ios: 'bell', android: 'notifications', web: 'notifications' },
  Ingresos: { ios: 'banknote', android: 'payments', web: 'payments' },
  Despensa: { ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' },
  Vivienda: { ios: 'house', android: 'home', web: 'home' },
  Comida: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' },
  Transporte: { ios: 'bus', android: 'directions_bus', web: 'directions_bus' },
  Pagos: { ios: 'receipt', android: 'receipt_long', web: 'receipt_long' },
} as const;
export function NavigationIcon({ name, active = false, size = 25 }: { name: string; active?: boolean; size?: number }) {
  return <View style={{ width: Math.max(40, size + 16), height: Math.max(40, size + 16), borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? colors.green : 'transparent' }}><SymbolView name={icons[name as keyof typeof icons] ?? icons.Resumen} size={size} tintColor={colors.ink} /></View>;
}
