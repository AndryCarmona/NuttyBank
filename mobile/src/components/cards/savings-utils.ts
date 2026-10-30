export function savingsMessage(saved: number, target: number) {
  const progress = target > 0 ? saved / target : 0;
  if (progress >= 1) return '¡Meta cumplida! Cada aportación hizo la diferencia.';
  if (progress >= .75) return '¡Ya casi! Estás en la recta final de tu meta.';
  if (progress >= .5) return '¡Más de la mitad! Tu constancia está dando frutos.';
  if (progress >= .25) return '¡Vas muy bien! Sigue sumando a tu futuro.';
  if (progress > 0) return '¡Buen comienzo! Cada pequeña aportación cuenta.';
  return 'Tu meta empieza con el primer paso. ¡Comienza hoy!';
}
export function savingsDate(value: string) {
  const date = new Date(value + 'T12:00:00');
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(date.getTime()) && date.getFullYear() === Number(value.slice(0,4)) && date.getMonth() + 1 === Number(value.slice(5,7)) && date.getDate() === Number(value.slice(8));
}
export function savingsAmount(value: string) {
  const normalized = value.trim().replace(',', '.');
  return /^\d+(\.\d{1,2})?$/.test(normalized) ? Number(normalized) : NaN;
}
