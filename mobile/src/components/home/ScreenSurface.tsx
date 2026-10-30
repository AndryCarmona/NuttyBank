import { type PropsWithChildren } from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from './data';

export function screenBackground(pathname: string) {
  return pathname === '/' || pathname.startsWith('/cards') || pathname.startsWith('/learn') || pathname === '/home/calendar' ? colors.green : colors.paper;
}

// El fondo llega hasta el borde físico; solo el contenido respeta la zona de la hora.
// Esta franja nunca forma parte del ScrollView ni se encoge por su contenido.
export default function ScreenSurface({ children, green = false }: PropsWithChildren<{ green?: boolean }>) {
  const insets = useSafeAreaInsets();
  const backgroundColor = green ? colors.green : colors.paper;
  return <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor }}>
    <View pointerEvents="none" style={{ height: insets.top, flexShrink: 0, backgroundColor }} />
    {children}
  </SafeAreaView>;
}
