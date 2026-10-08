// Small helpers for hand-building SVG markup. No dependencies on purpose:
// the GitHub Action runs these with a bare Node install.

import { readFileSync } from 'node:fs';
import { FONT_MONO, FONT_SANS } from './theme.mjs';

const ICON_ROOT = new URL('../icons/', import.meta.url);
const iconCache = new Map();

export const esc = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Trim floats so the output stays small and diff-friendly.
export const num = (value) => String(Math.round(value * 100) / 100);

// Monospace glyphs advance ~0.6em in every common coding font, so mono text
// is the only text whose width we can know without a browser.
export const MONO_ADVANCE = 0.6;
export const monoWidth = (text, size, tracking = 0) =>
  text.length * (size * MONO_ADVANCE + tracking) - tracking;

export function svgDoc({ width, height, title, style = '', defs = '', body }) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" role="img">`,
    `<title>${esc(title)}</title>`,
    '<style>',
    `text { font-family: ${FONT_SANS}; }`,
    `.mono { font-family: ${FONT_MONO}; }`,
    style.trim(),
    '@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }',
    '</style>',
    defs.trim() ? `<defs>\n${defs.trim()}\n</defs>` : '',
    body.trim(),
    '</svg>',
    '',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

function readIcon(path) {
  if (!iconCache.has(path)) iconCache.set(path, readFileSync(new URL(path, ICON_ROOT), 'utf8'));
  return iconCache.get(path);
}

function splitSvg(source) {
  const open = source.match(/<svg\b[^>]*>/);
  if (!open) throw new Error('Not an SVG file');
  const viewBox = open[0].match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 24 24';
  const inner = source.slice(open.index + open[0].length, source.lastIndexOf('</svg>')).trim();
  return { viewBox, inner };
}

// Full-colour brand logo (devicon), nested as its own <svg> so its viewBox is
// kept. Gradient ids are namespaced: several logos ship ids like "a" and "b".
export function brandIcon(file, x, y, size) {
  const { viewBox, inner } = splitSvg(readIcon(`brand/${file}.svg`));
  const ns = `ic-${file}`;
  const scoped = inner
    .replace(/\bid="([^"]+)"/g, `id="${ns}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${ns}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${ns}-$1"`);
  return `<svg x="${num(x)}" y="${num(y)}" width="${size}" height="${size}" viewBox="${viewBox}">${scoped}</svg>`;
}

// Stroke icon (lucide, 24x24 grid) drawn in a single colour.
export function uiIcon(name, x, y, size, color, strokeWidth = 2) {
  const { inner } = splitSvg(readIcon(`ui/${name}.svg`));
  return (
    `<g transform="translate(${num(x)} ${num(y)}) scale(${num(size / 24)})" fill="none" stroke="${color}" ` +
    `stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${inner.replace(/\s+/g, ' ')}</g>`
  );
}

// Rounded square with a diagonal accent gradient and a white glyph.
export function iconTile({ id, x, y, size, radius, from, to, icon }) {
  const glyph = Math.round(size * 0.52);
  const defs = `
<linearGradient id="${id}" x1="${x}" y1="${y}" x2="${x + size}" y2="${y + size}" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="${from}"/>
  <stop offset="1" stop-color="${to}"/>
</linearGradient>`;
  const body = `
<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" fill="url(#${id})"/>
<rect x="${x + 0.5}" y="${y + 0.5}" width="${size - 1}" height="${size - 1}" rx="${radius - 0.5}" stroke="#ffffff" stroke-opacity="0.22"/>
${uiIcon(icon, x + (size - glyph) / 2, y + (size - glyph) / 2, glyph, '#ffffff')}`;
  return { defs, body };
}

// Card surface with a gradient hairline edge and a soft accent glow in one corner.
export function cardShell({ id, x, y, w, h, radius = 20, theme, accent, glow = [w - 40, 0], glowRadius = 120 }) {
  const t = theme;
  const defs = `
<clipPath id="${id}-clip"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}"/></clipPath>
<linearGradient id="${id}-edge" x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="${accent}" stop-opacity="0.7"/>
  <stop offset="0.5" stop-color="${t.border}"/>
  <stop offset="1" stop-color="${t.border}"/>
</linearGradient>
<filter id="${id}-blur" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="40"/></filter>
${t.shadow ? `<filter id="${id}-shadow" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="${t.shadow.color}" flood-opacity="${t.shadow.opacity}"/></filter>` : ''}`;
  const body = `
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${t.surface}"${t.shadow ? ` filter="url(#${id}-shadow)"` : ''}/>
<g clip-path="url(#${id}-clip)">
  <circle class="glow" cx="${x + glow[0]}" cy="${y + glow[1]}" r="${glowRadius}" fill="${accent}" opacity="${t.glowOpacity}" filter="url(#${id}-blur)"/>
</g>
<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="${radius - 0.5}" stroke="url(#${id}-edge)"/>`;
  return { defs, body };
}

export const GLOW_STYLE = `
.glow { transform-box: fill-box; transform-origin: center; animation: breathe 9s ease-in-out infinite alternate; }
@keyframes breathe { from { transform: scale(0.9); } to { transform: scale(1.2); } }`;

// Monospace pills laid out left to right. Returns the markup and total width.
export function chips(tags, { x, y, theme, size = 11.5, padX = 10, height = 24, gap = 8 }) {
  let cursor = x;
  let svg = '';
  for (const tag of tags) {
    const w = monoWidth(tag, size) + padX * 2;
    svg +=
      `<rect x="${num(cursor)}" y="${y}" width="${num(w)}" height="${height}" rx="${height / 2}" fill="${theme.raised}" stroke="${theme.border}"/>` +
      `<text class="mono" x="${num(cursor + w / 2)}" y="${num(y + height / 2 + size * 0.35)}" text-anchor="middle" font-size="${size}" fill="${theme.ink2}">${esc(tag)}</text>\n`;
    cursor += w + gap;
  }
  return { svg, width: cursor - gap - x };
}

// Deterministic pseudo-random numbers so regenerated files don't churn.
export function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}
