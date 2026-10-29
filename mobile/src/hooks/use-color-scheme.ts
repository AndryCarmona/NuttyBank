// La app usa siempre el modo claro (el mockup solo define esa paleta).
// Cuando exista el modo oscuro de Ajustes, bastará con volver a:
//   export { useColorScheme } from 'react-native';
export function useColorScheme(): 'light' | 'dark' {
  return 'light';
}
