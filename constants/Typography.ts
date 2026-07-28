import type { TextStyle } from 'react-native';

type TypographyToken = Pick<TextStyle, 'fontSize' | 'fontWeight' | 'lineHeight'>;

// Escala usada en toda la app en vez de fontSize sueltos por archivo.
export const Typography: Record<string, TypographyToken> = {
  h1: { fontSize: 24, fontWeight: '700' }, // login, register, complete-profile
  h2: { fontSize: 22, fontWeight: '700' }, // títulos de pantalla (ya usado en admin)
  h3: { fontSize: 18, fontWeight: '700' }, // títulos de modal
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  body: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodyBold: { fontSize: 14, fontWeight: '700' },
  subtitle: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '400' },
  label: { fontSize: 11, fontWeight: '700' },
};
