import { StyleSheet, Text, type TextProps } from 'react-native';

import { Poppins } from '@/constants/theme';

/**
 * Mensaje de error en una "etiqueta" clara. Se ve bien sobre el panel verde, donde
 * el texto rojo suelto casi no se distingue.
 */
export function ErrorNote({ style, ...rest }: TextProps) {
  return <Text accessibilityLiveRegion="polite" style={[styles.note, style]} {...rest} />;
}

const styles = StyleSheet.create({
  note: {
    alignSelf: 'flex-start',
    backgroundColor: '#FDECEA',
    color: '#912018',
    fontFamily: Poppins.medium,
    fontSize: 12,
    lineHeight: 18,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
});
