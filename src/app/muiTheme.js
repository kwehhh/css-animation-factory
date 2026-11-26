import { createTheme } from '@material-ui/core/styles';
import { getTheme } from '@nurvus/ui';

// Material-UI theme for each @nurvus/ui theme. Without one, MUI used its stock
// indigo (#3f51b5): outlined buttons and field labels came out at 1.8-2.7:1.
//
// MUI derives hover/focus shades from these, so they must be real colors, not
// var(--nv-*): they come straight from the theme's JSON (theme.colors). The
// design system checks accent, text and text-muted at >= 4.5:1 on the theme's
// bg (the panels here) and surface.

const FALLBACK = 'tokyo-neon';
const FONT = "'InterVariable', 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

/** "#7AA2F7" -> "122, 162, 247", for rgba() tints. */
const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ');

function buildTheme(theme) {
  const c = theme.colors;
  const accent = rgbOf(c.accent);
  return createTheme({
    palette: {
      type: theme.mode,
      primary: { main: c.accent },
      error: { main: c.danger },
      background: { paper: c.bg, default: c['bg-deep'] },
      text: { primary: c.text, secondary: c['text-muted'], disabled: c['text-subtle'] },
      divider: c.border,
    },
    typography: { fontFamily: FONT },
    overrides: {
      MuiButton: {
        // Sentence case, like the header's Presets / Export buttons.
        root: { textTransform: 'none' },
        // "Add attribute", "Add", "Assign classes": the header buttons' look
        // (text color on an accent tint, accent edge on hover).
        outlinedPrimary: {
          color: c.text,
          backgroundColor: `rgba(${accent}, 0.14)`,
          borderColor: c.border,
          '&:hover': {
            backgroundColor: `rgba(${accent}, 0.24)`,
            borderColor: c.accent,
          },
        },
      },
    },
  });
}

const cache = {};

/** The MUI theme for a @nurvus/ui theme id (unknown ids get Tokyo Neon). */
export const getMuiTheme = (id) => {
  const theme = getTheme(id) || getTheme(FALLBACK);
  if (!cache[theme.id]) cache[theme.id] = buildTheme(theme);
  return cache[theme.id];
};

export default getMuiTheme;
