// Design tokens shared by every generated SVG. Each asset is rendered twice,
// once per theme, and the README picks the right one with <picture>.

export const FONT_SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";
export const FONT_MONO =
  "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

// Saturated accents: used for icon tiles (with a white glyph) in both themes.
export const SOLID = {
  violet: '#7c3aed',
  cyan: '#0891b2',
  pink: '#db2777',
  blue: '#2563eb',
  emerald: '#059669',
};

export const THEMES = {
  dark: {
    name: 'dark',
    banner: '#0a0d1c',
    surface: '#0f1324',
    raised: '#161b33',
    border: '#262c4a',
    ink: '#eef0fb',
    ink2: '#a9b0cc',
    muted: '#6f7694',
    hairline: '#232845',
    blobs: ['#7c3aed', '#0891b2', '#db2777', '#2563eb'],
    blobOpacity: 0.62,
    dotOpacity: 0.16,
    star: '#ffffff',
    glowOpacity: 0.32,
    // Softer accents for text and glows on the dark surface.
    accent: { violet: '#a78bfa', cyan: '#22d3ee', pink: '#f472b6', blue: '#60a5fa', emerald: '#34d399' },
    gradient: ['#a78bfa', '#22d3ee', '#f472b6'],
    // Categorical chart slots, validated all-pairs (CVD + normal vision) on this surface.
    series: ['#7c3aed', '#0891b2', '#db2777'],
    other: '#3b4264',
    bars: '#7c3aed',
    shadow: null,
  },
  light: {
    name: 'light',
    banner: '#f8f6ff',
    surface: '#ffffff',
    raised: '#f6f5fc',
    border: '#e6e3f3',
    ink: '#151829',
    ink2: '#4a4f68',
    muted: '#7d8299',
    hairline: '#ebe9f4',
    blobs: ['#c4b5fd', '#a5f3fc', '#fbcfe8', '#bfdbfe'],
    blobOpacity: 0.95,
    dotOpacity: 0.22,
    star: '#7c3aed',
    glowOpacity: 0.16,
    accent: { ...SOLID },
    gradient: ['#7c3aed', '#0891b2', '#db2777'],
    series: ['#7c3aed', '#0891b2', '#db2777'],
    other: '#cdd1e0',
    bars: '#7c3aed',
    shadow: { color: '#3b2f7a', opacity: 0.1 },
  },
};

export const THEME_NAMES = Object.keys(THEMES);
