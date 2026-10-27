import { createTheme } from '@material-ui/core/styles';

// Material-UI themes for the factory's dark and light themes. Without one,
// MUI used its stock indigo (#3f51b5) on our navy: outlined buttons and field
// labels came out at 1.8-2.7:1 contrast.
//
// MUI derives hover/focus shades from these, so they are real colors, not
// var(--caf-*). Keep them in step with variables.scss.
const TOKENS = {
  dark: {
    // Lighter than --caf-accent (#6e6df8, 3.9:1 on the panels): this one stays
    // over 4.5:1 even where the frosted panel sits over a light preview.
    primary: '#9d9cfb',
    accent: '110, 109, 248',
    paper: '#1f2236',
    ground: '#131422',
    text: '#e8eaf3',
    muted: 'rgba(232, 234, 243, 0.6)',
    disabled: 'rgba(232, 234, 243, 0.38)',
    border: 'rgba(138, 137, 250, 0.18)',
  },
  light: {
    primary: '#504ff6',
    accent: '80, 79, 246',
    paper: '#ffffff',
    ground: '#eef0f6',
    text: '#1a1c2d',
    // 0.7, not --caf-muted's 0.6: field labels sit on the light field card,
    // where 0.6 is 4.3:1 and 0.7 is 5.9:1.
    muted: 'rgba(26, 28, 45, 0.7)',
    disabled: 'rgba(26, 28, 45, 0.38)',
    border: 'rgba(80, 79, 246, 0.2)',
  },
};

// The neutral palette (variables.scss, data-caf-palette): grey surfaces and
// hairlines, same accent.
const NEUTRAL = {
  dark: {
    paper: '#17181f',
    ground: '#0b0c10',
    text: '#e7e9ee',
    muted: 'rgba(231, 233, 238, 0.6)',
    disabled: 'rgba(231, 233, 238, 0.38)',
    border: 'rgba(255, 255, 255, 0.09)',
  },
  light: {
    paper: '#ffffff',
    ground: '#f6f7fa',
    text: '#161820',
    muted: 'rgba(22, 24, 32, 0.7)',
    disabled: 'rgba(22, 24, 32, 0.38)',
    border: 'rgba(20, 24, 40, 0.12)',
  },
};

const FONT = "'InterVariable', 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

function buildTheme(type, palette) {
  const t = palette === 'neutral' ? { ...TOKENS[type], ...NEUTRAL[type] } : TOKENS[type];
  return createTheme({
    palette: {
      type,
      primary: { main: t.primary },
      background: { paper: t.paper, default: t.ground },
      text: { primary: t.text, secondary: t.muted, disabled: t.disabled },
      divider: t.border,
    },
    typography: { fontFamily: FONT },
    overrides: {
      MuiButton: {
        // Sentence case, like the header's Presets / Export buttons.
        root: { textTransform: 'none' },
        // "Add attribute", "Add", "Assign classes": the header buttons' look
        // (@nurvus/ui secondary): text color on an accent tint, accent edge
        // on hover.
        outlinedPrimary: {
          color: t.text,
          backgroundColor: `rgba(${t.accent}, 0.14)`,
          borderColor: t.border,
          '&:hover': {
            backgroundColor: `rgba(${t.accent}, 0.24)`,
            borderColor: `rgb(${t.accent})`,
          },
        },
      },
    },
  });
}

const muiThemes = {
  dark: buildTheme('dark'),
  light: buildTheme('light'),
  darkNeutral: buildTheme('dark', 'neutral'),
  lightNeutral: buildTheme('light', 'neutral'),
};

/** The MUI theme for a theme ('dark' | 'light') + palette ('nurvus' | 'neutral'). */
export const getMuiTheme = (theme, palette) => muiThemes[palette === 'neutral' ? `${theme}Neutral` : theme];

export default muiThemes;
