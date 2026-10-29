export const colors = { ink: '#20272D', green: '#7EA582', bright: '#26CC70', paper: '#FAF9F6', panel: '#EFF1F4', muted: '#737C7B' };
export const money = (value: number) => `${value < 0 ? '−' : ''}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const transactions = [
  { id: '1', name: 'Sueldo', category: 'Ingresos', amount: 4000, day: 30, time: '18:27', icon: '▱', color: colors.green },
  { id: '2', name: 'Supermercado', category: 'Despensa', amount: -100, day: 24, time: '17:00', icon: '♧', color: colors.bright },
  { id: '3', name: 'Alquiler', category: 'Vivienda', amount: -674.4, day: 15, time: '8:30', icon: '⌂', color: '#E2E8DE' },
  { id: '4', name: 'Comida semanal', category: 'Comida', amount: -100, day: 22, time: '14:00', icon: '♜', color: '#E3EBD5' },
  { id: '5', name: 'Transporte', category: 'Transporte', amount: -193, day: 8, time: '9:10', icon: '⇄', color: '#DEE8EB' },
  { id: '6', name: 'Otros', category: 'Pagos', amount: -120, day: 24, time: '17:00', icon: '▱', color: colors.green },
];
export const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum - t.amount, 0);
export const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
