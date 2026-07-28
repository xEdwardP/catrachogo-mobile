// Paleta de marca CatrachoGo (ver CLAUDE.md — "Identidad visual"), misma que catrachogo-web.
const primary = '#E8532E';
const success = '#158059';

export default {
  light: {
    text: '#211D1B',
    textSecondary: '#6B6560',
    background: '#F6F1EC',
    // Blanco puro, no el "brand-pale" (#FDEAE3) de catrachogo-web: ese tono es casi
    // igual de claro que el fondo (#F6F1EC), así que las tarjetas casi no se
    // distinguían del fondo general. La web tampoco usa brand-pale para tarjetas
    // (usa bg-white + sombra; brand-pale ahí es solo para acentos puntuales como
    // círculos de ícono) — blanco puro da el contraste real que faltaba.
    surfaceHighlight: '#FFFFFF',
    tint: primary,
    success,
    tabIconDefault: '#B8B0A8',
    tabIconSelected: primary,
  },
  // catrachogo-web es solo modo claro; esta paleta oscura es propia de mobile
  // (confirmada como requisito — ver CLAUDE.md "Identidad visual").
  dark: {
    text: '#F5F1ED',
    textSecondary: '#A39C95',
    background: '#1C1917',
    surfaceHighlight: '#2E211C',
    tint: primary,
    success,
    tabIconDefault: '#6B6560',
    tabIconSelected: primary,
  },
};
