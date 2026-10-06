// Color palettes. To try a new one, copy a palette below, give it a new `name`, and change the
// hex values. It appears in the Tune window's palette picker; set `defaultPalette` to make it
// the one visitors get.
//
// Each palette has a light and a dark mode (the theme toggle switches between them). Only the
// colors below are set by hand; panel tint, divider lines and the simulation background are
// derived from them in `paletteCss()`. All values must be 6-digit hex.

export type Mode = {
  bg: string; // page and simulation background
  text: string; // body text
  muted: string; // secondary text, numbers, dates
  accent: string; // highlights: "Pavlov", chapter labels, link hover, bullets
  // Slime color ramp, from the faintest trails to the densest strands (1 to 5 colors). The
  // simulation blends from `bg` into the first color, then through the rest in order.
  slime: string[];
};

export type Palette = { name: string; label: string; light: Mode; dark: Mode };

export const palettes: Palette[] = [
  {
    // The full five-color palette: #023047 #219ebc #8ecae6 #ffb703 #fb8500, every color used.
    // Light mode is its negative: the navy and sky-blue roles swap.
    name: 'ocean',
    label: 'Ocean',
    dark: {
      bg: '#023047',
      text: '#8ecae6',
      muted: '#219ebc',
      accent: '#fb8500',
      slime: ['#219ebc', '#8ecae6', '#ffb703', '#fb8500'],
    },
    light: {
      bg: '#8ecae6',
      text: '#023047',
      muted: '#0b4f6c', // darker shade of #219ebc: the palette's own is too faint on sky blue
      accent: '#fb8500',
      slime: ['#219ebc', '#023047', '#fb8500'],
    },
  },
  {
    // Built around #023047 (Prussian blue) as the dark background, with its usual companions
    // #8ecae6, #219ebc, #ffb703 and #fb8500.
    name: 'prussian',
    label: 'Prussian',
    dark: {
      bg: '#023047',
      text: '#e8f4f8',
      muted: '#8ecae6',
      accent: '#ffb703',
      slime: ['#219ebc', '#ffb703'],
    },
    light: {
      bg: '#eaf4f8',
      text: '#023047',
      muted: '#3f6b80',
      accent: '#c25e00',
      slime: ['#8ecae6', '#023047'],
    },
  },
  {
    // coolors.co/palette/cdb4db-ffc8dd-ffafcc-bde0fe-a2d2ff. All pastels, so the dark background
    // and the text ink are derived (marked *).
    name: 'pastel',
    label: 'Pastel',
    dark: {
      bg: '#2a2238', // *
      text: '#bde0fe',
      muted: '#cdb4db',
      accent: '#ffafcc',
      slime: ['#a2d2ff', '#cdb4db', '#ffc8dd', '#ffafcc'],
    },
    light: {
      bg: '#bde0fe',
      text: '#2a2238', // *
      muted: '#5a4a6e', // *
      accent: '#b03a6a', // * deeper #ffafcc, readable on blue
      slime: ['#cdb4db', '#ffafcc', '#5a4a6e'],
    },
  },
  {
    // coolors.co/palette/e63946-f1faee-a8dadc-457b9d-1d3557
    name: 'harbor',
    label: 'Harbor',
    dark: {
      bg: '#1d3557',
      text: '#f1faee',
      muted: '#a8dadc',
      accent: '#e63946',
      slime: ['#457b9d', '#a8dadc', '#f1faee', '#e63946'],
    },
    light: {
      bg: '#f1faee',
      text: '#1d3557',
      muted: '#457b9d',
      accent: '#e63946',
      slime: ['#a8dadc', '#457b9d', '#1d3557', '#e63946'],
    },
  },
  {
    // coolors.co/palette/5f0f40-9a031e-fb8b24-e36414-0f4c5c. No light color, so the cream text /
    // light background is derived (marked *).
    name: 'ember',
    label: 'Ember',
    dark: {
      bg: '#0f4c5c',
      text: '#fdeee0', // *
      muted: '#b9d3d9', // *
      accent: '#fb8b24',
      slime: ['#5f0f40', '#9a031e', '#e36414', '#fb8b24'],
    },
    light: {
      bg: '#fdeee0', // *
      text: '#5f0f40',
      muted: '#0f4c5c',
      accent: '#9a031e',
      slime: ['#fb8b24', '#e36414', '#9a031e', '#5f0f40'],
    },
  },
  {
    // coolors.co/palette/3d0066-510087-5c0099-fdc500-ffd500. Text ink and the light background
    // are derived (marked *).
    name: 'royal',
    label: 'Royal',
    dark: {
      bg: '#3d0066',
      text: '#f5ecff', // *
      muted: '#fdc500',
      accent: '#ffd500',
      slime: ['#510087', '#5c0099', '#fdc500', '#ffd500'],
    },
    light: {
      bg: '#fff8d6', // *
      text: '#3d0066',
      muted: '#5c0099',
      accent: '#510087',
      slime: ['#fdc500', '#5c0099', '#3d0066'],
    },
  },
  {
    // coolors.co/palette/ff4e00-8ea604-f5bb00-ec9f05-bf3100. All mid-tones, so both backgrounds
    // and the text inks are derived (marked *).
    name: 'harvest',
    label: 'Harvest',
    dark: {
      bg: '#1f1a0e', // *
      text: '#f7ecd2', // *
      muted: '#ec9f05',
      accent: '#ff4e00',
      slime: ['#8ea604', '#bf3100', '#ff4e00', '#f5bb00'],
    },
    light: {
      bg: '#fbf1dc', // *
      text: '#2e1a0a', // *
      muted: '#bf3100',
      accent: '#ff4e00',
      slime: ['#f5bb00', '#8ea604', '#bf3100'],
    },
  },
  {
    // The original slime-mold yellow on near-black / green ink on paper.
    name: 'moss',
    label: 'Moss',
    dark: {
      bg: '#0c0f0d',
      text: '#ece8da',
      muted: '#9aa49c',
      accent: '#f2c94c',
      slime: ['#2b5e47', '#f4d35e'],
    },
    light: {
      bg: '#efeadc',
      text: '#18201b',
      muted: '#56615a',
      accent: '#9a6b00',
      slime: ['#9fb5a2', '#1f4f3a'],
    },
  },
];

export const defaultPalette = 'ocean';

const rgb = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

// Native controls (scrollbars, selects), panel opacity and focus ring follow how dark the
// background actually is, not which mode slot it sits in.
const isDark = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255) < 128;
};

const vars = (m: Mode) => {
  const scheme = isDark(m.bg) ? 'dark' : 'light';
  return [
    `color-scheme: ${scheme};`,
    `--bg: ${m.bg};`,
    `--panel: rgb(${rgb(m.bg)} / ${scheme === 'dark' ? 0.78 : 0.82});`,
    `--text: ${m.text};`,
    `--muted: ${m.muted};`,
    `--line: rgb(${rgb(m.text)} / ${scheme === 'dark' ? 0.2 : 0.22});`,
    `--accent: ${m.accent};`,
    `--focus: ${scheme === 'dark' ? '#7cc4ff' : '#0060df'};`,
    `--sim-bg: ${m.bg};`,
    `--sim-stops: ${m.slime.slice(0, 5).join(' ')};`, // read by the WebGL layer
    `--sim-low: ${m.slime[0]};`, // first/last also used by the no-WebGL fallback
    `--sim-high: ${m.slime[m.slime.length - 1]};`,
  ].join(' ');
};

// CSS for every palette: light by default, dark when the system prefers it (unless the theme
// toggle forced light), and dark when the toggle forces it.
export const paletteCss = () =>
  palettes
    .map((p) => {
      const sel = `:root[data-palette='${p.name}']`;
      return [
        `${sel} { ${vars(p.light)} }`,
        `@media (prefers-color-scheme: dark) { ${sel}:not([data-theme='light']) { ${vars(p.dark)} } }`,
        `${sel}[data-theme='dark'] { ${vars(p.dark)} }`,
      ].join('\n');
    })
    .join('\n');
