import { Colors } from './colors';

export const Typography = {
  h1         : { fontSize: 28, fontWeight: '700' as const, color: Colors.textPrimary },
  h2         : { fontSize: 22, fontWeight: '700' as const, color: Colors.textPrimary },
  h3         : { fontSize: 18, fontWeight: '600' as const, color: Colors.textPrimary },
  h4         : { fontSize: 16, fontWeight: '600' as const, color: Colors.textPrimary },
  body       : { fontSize: 14, fontWeight: '400' as const, color: Colors.textPrimary },
  bodyMedium : { fontSize: 14, fontWeight: '500' as const, color: Colors.textPrimary },
  caption    : { fontSize: 12, fontWeight: '400' as const, color: Colors.textSecondary },
  captionMed : { fontSize: 12, fontWeight: '500' as const, color: Colors.textSecondary },
  tiny       : { fontSize: 11, fontWeight: '400' as const, color: Colors.textMuted },
  buttonLabel: { fontSize: 15, fontWeight: '600' as const, color: Colors.white },
  navLabel   : { fontSize: 10, fontWeight: '400' as const },
  sectionLabel: { fontSize: 11, fontWeight: '500' as const, color: Colors.textMuted, letterSpacing: 1.5 },
};
