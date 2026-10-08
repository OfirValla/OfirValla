// Renders the static artwork (everything except the stats cards) into assets/,
// one file per theme. Deterministic: same config in, same bytes out.

import { mkdirSync, writeFileSync } from 'node:fs';
import config from './profile.config.mjs';
import { SOLID, THEMES } from './lib/theme.mjs';
import {
  GLOW_STYLE,
  brandIcon,
  cardShell,
  chips,
  esc,
  iconTile,
  monoWidth,
  num,
  seeded,
  svgDoc,
  uiIcon,
} from './lib/svg.mjs';

const OUT = new URL('../assets/', import.meta.url);
const W = 1000; // full-width artwork
const INSET = 14; // keeps edges aligned with the half-width cards and leaves room for shadows

const RISE_STYLE = `
.rise { animation: rise 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
@keyframes rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }`;

// ---------------------------------------------------------------- header

function header(t) {
  const H = 314; // frame plus breathing room above the intro paragraph
  const frame = { x: INSET, y: 6, w: W - INSET * 2, h: 288, r: 26 };
  const cx = W / 2;
  const rand = seeded(42);

  // Typing line: monospace + textLength makes every glyph exactly `cw` wide,
  // so the reveal clip and the caret can step one character at a time.
  const size = 19;
  const cw = size * 0.6;
  const baseline = 252;
  const step = { type: 0.065, hold: 2.1, erase: 0.026, gap: 0.45 };
  const lines = config.typing.map((text) => ({
    text,
    n: text.length,
    span: text.length * (step.type + step.erase) + step.hold + step.gap,
  }));
  const cycle = lines.reduce((sum, line) => sum + line.span, 0);
  const key = (seconds) => (seconds / cycle).toFixed(5);

  let typingDefs = '';
  let typingBody = '';
  let start = 0;
  lines.forEach((line, i) => {
    const textWidth = line.n * cw;
    const x0 = cx - (textWidth + 24) / 2;
    const tx = x0 + 24;
    const holdEnd = start + line.n * step.type + step.hold;
    const end = holdEnd + line.n * step.erase;

    const times = [0];
    const widths = [0];
    for (let k = 1; k <= line.n; k++) {
      times.push(start + k * step.type);
      widths.push(k * cw);
    }
    for (let k = 1; k <= line.n; k++) {
      times.push(holdEnd + k * step.erase);
      widths.push((line.n - k) * cw);
    }
    const keyTimes = times.map(key).join(';');
    const visible =
      start === 0
        ? `values="1;0" keyTimes="0;${key(end)}"`
        : `values="0;1;0" keyTimes="0;${key(start)};${key(end)}"`;

    typingDefs += `
<clipPath id="type-${i}"><rect x="${num(tx - 1)}" y="${baseline - size}" height="${size * 1.6}" width="0">
  <animate attributeName="width" dur="${num(cycle)}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${keyTimes}" values="${widths.map(num).join(';')}"/>
</rect></clipPath>`;

    typingBody += `
<g opacity="${start === 0 ? 1 : 0}">
  <animate attributeName="opacity" dur="${num(cycle)}s" repeatCount="indefinite" calcMode="discrete" ${visible}/>
  <path d="M${num(x0)} ${baseline - 12} l7 6 l-7 6" stroke="${t.accent.violet}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  <text class="mono" x="${num(tx)}" y="${baseline}" font-size="${size}" textLength="${num(textWidth)}" lengthAdjust="spacingAndGlyphs" fill="url(#type-fill)" clip-path="url(#type-${i})">${esc(line.text)}</text>
  <rect class="caret" x="${num(tx + 2)}" y="${baseline - size + 2}" width="2.5" height="${size + 2}" rx="1" fill="${t.accent.cyan}">
    <animate attributeName="x" dur="${num(cycle)}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${keyTimes}" values="${widths.map((w) => num(tx + w + 2)).join(';')}"/>
  </rect>
</g>`;
    start += line.span;
  });

  const greeting = config.greeting.toUpperCase();
  const pillText = monoWidth(greeting, 12, 3);
  const pillW = pillText + 52;
  const pillX = cx - pillW / 2;

  const stars = Array.from({ length: 18 }, () => {
    const x = frame.x + 30 + rand() * (frame.w - 60);
    const y = frame.y + 20 + rand() * (frame.h - 40);
    const r = 0.8 + rand() * 1.2;
    const delay = (rand() * 6).toFixed(2);
    return `<circle class="star" cx="${num(x)}" cy="${num(y)}" r="${num(r)}" fill="${t.star}" style="animation-delay:-${delay}s"/>`;
  }).join('\n');

  const blobs = [
    { cx: 200, cy: 40, r: 190, anim: 'drift-a 19s' },
    { cx: 830, cy: 60, r: 175, anim: 'drift-b 23s' },
    { cx: 610, cy: 300, r: 170, anim: 'drift-c 17s' },
    { cx: 330, cy: 300, r: 150, anim: 'drift-d 21s' },
  ];

  const style = `
.blob { animation-timing-function: ease-in-out; animation-iteration-count: infinite; animation-direction: alternate; }
@keyframes drift-a { to { transform: translate(150px, 50px); } }
@keyframes drift-b { to { transform: translate(-170px, 40px); } }
@keyframes drift-c { to { transform: translate(-140px, -60px); } }
@keyframes drift-d { to { transform: translate(160px, -40px); } }
.star { animation: twinkle 6s ease-in-out infinite; }
@keyframes twinkle { 0%, 100% { opacity: 0.08; } 50% { opacity: ${t.name === 'dark' ? 0.75 : 0.4}; } }
.caret { animation: blink 1s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0; } }
.pulse { transform-box: fill-box; transform-origin: center; animation: pulse 2.4s ease-out infinite; }
@keyframes pulse { from { transform: scale(1); opacity: 0.7; } to { transform: scale(2.6); opacity: 0; } }`;

  const defs = `
<clipPath id="frame"><rect x="${frame.x}" y="${frame.y}" width="${frame.w}" height="${frame.h}" rx="${frame.r}"/></clipPath>
<filter id="blur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="58"/></filter>
<filter id="name-glow" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="16"/></filter>
<pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="${t.ink}"/></pattern>
<radialGradient id="dot-fade" cx="0.5" cy="0.5" r="0.62">
  <stop offset="0" stop-color="#fff" stop-opacity="1"/>
  <stop offset="1" stop-color="#fff" stop-opacity="0"/>
</radialGradient>
<mask id="dot-mask"><rect x="0" y="0" width="${W}" height="${H}" fill="url(#dot-fade)"/></mask>
<linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="${t.gradient[0]}" stop-opacity="0.75"/>
  <stop offset="0.5" stop-color="${t.gradient[1]}" stop-opacity="0.35"/>
  <stop offset="1" stop-color="${t.gradient[2]}" stop-opacity="0.75"/>
</linearGradient>
<linearGradient id="type-fill" x1="260" y1="0" x2="740" y2="0" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="${t.gradient[0]}"/>
  <stop offset="0.5" stop-color="${t.gradient[1]}"/>
  <stop offset="1" stop-color="${t.gradient[2]}"/>
</linearGradient>
${typingDefs}`;

  const body = `
<g clip-path="url(#frame)">
  <rect x="${frame.x}" y="${frame.y}" width="${frame.w}" height="${frame.h}" fill="${t.banner}"/>
  <g filter="url(#blur)" opacity="${t.blobOpacity}">
${blobs.map((b, i) => `    <circle class="blob" style="animation-name:${b.anim.split(' ')[0]};animation-duration:${b.anim.split(' ')[1]}" cx="${b.cx}" cy="${b.cy}" r="${b.r}" fill="${t.blobs[i]}"/>`).join('\n')}
  </g>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#dots)" mask="url(#dot-mask)" opacity="${t.dotOpacity}"/>
  ${stars}
</g>
<rect x="${frame.x + 0.5}" y="${frame.y + 0.5}" width="${frame.w - 1}" height="${frame.h - 1}" rx="${frame.r - 0.5}" stroke="url(#edge)"/>

<rect x="${num(pillX)}" y="58" width="${num(pillW)}" height="30" rx="15" fill="#ffffff" fill-opacity="${t.name === 'dark' ? 0.06 : 0.7}" stroke="${t.name === 'dark' ? '#ffffff' : t.border}" stroke-opacity="${t.name === 'dark' ? 0.16 : 1}"/>
<circle class="pulse" cx="${num(pillX + 20)}" cy="73" r="4" fill="${t.accent.emerald}"/>
<circle cx="${num(pillX + 20)}" cy="73" r="4" fill="${t.accent.emerald}"/>
<text class="mono" x="${num(pillX + 34)}" y="77.5" font-size="12" letter-spacing="3" fill="${t.ink2}">${esc(greeting)}</text>

${t.name === 'dark' ? `<text x="${cx}" y="160" text-anchor="middle" font-size="76" font-weight="800" letter-spacing="-1.5" fill="${t.accent.violet}" opacity="0.55" filter="url(#name-glow)">${esc(config.name)}</text>` : ''}
<text x="${cx}" y="160" text-anchor="middle" font-size="76" font-weight="800" letter-spacing="-1.5" fill="${t.ink}">${esc(config.name)}</text>
<text x="${cx}" y="203" text-anchor="middle" font-size="22" font-weight="500" letter-spacing="0.3" fill="${t.ink2}">${esc(config.role)}</text>
${typingBody}`;

  return svgDoc({ width: W, height: H, title: `${config.name}, ${config.role}`, style, defs, body });
}

// ---------------------------------------------------------- section title

function sectionTitle(t, { label, caption }) {
  const H = 84;
  const cx = W / 2;
  const text = label.toUpperCase();
  const size = 13;
  const tracking = 4;
  const width = monoWidth(text, size, tracking);
  const left = cx - width / 2;
  const right = cx + width / 2;
  const y = 34;

  const defs = `
<linearGradient id="label" x1="${num(left)}" y1="0" x2="${num(right)}" y2="0" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="${t.gradient[0]}"/>
  <stop offset="0.5" stop-color="${t.gradient[1]}"/>
  <stop offset="1" stop-color="${t.gradient[2]}"/>
</linearGradient>
<linearGradient id="rule-l" x1="${num(left - 40)}" y1="0" x2="${INSET + 120}" y2="0" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="${t.gradient[0]}" stop-opacity="0.8"/>
  <stop offset="1" stop-color="${t.gradient[0]}" stop-opacity="0"/>
</linearGradient>
<linearGradient id="rule-r" x1="${num(right + 40)}" y1="0" x2="${W - INSET - 120}" y2="0" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="${t.gradient[2]}" stop-opacity="0.8"/>
  <stop offset="1" stop-color="${t.gradient[2]}" stop-opacity="0"/>
</linearGradient>`;

  const diamond = (x, color) =>
    `<rect x="${num(x - 3.5)}" y="${y - 8.5}" width="7" height="7" rx="1.5" fill="${color}" transform="rotate(45 ${num(x)} ${y - 5})"/>`;

  const body = `
<path d="M${num(left - 40)} ${y - 5} H${INSET + 120}" stroke="url(#rule-l)" stroke-width="1.5"/>
<path d="M${num(right + 40)} ${y - 5} H${W - INSET - 120}" stroke="url(#rule-r)" stroke-width="1.5"/>
${diamond(left - 22, t.gradient[0])}
${diamond(right + 22, t.gradient[2])}
<text class="mono" x="${num(left)}" y="${y}" font-size="${size}" font-weight="700" letter-spacing="${tracking}" fill="url(#label)">${esc(text)}</text>
<text x="${cx}" y="${y + 30}" text-anchor="middle" font-size="14" fill="${t.muted}">${esc(caption)}</text>`;

  return svgDoc({ width: W, height: H, title: label, defs, body });
}

// ------------------------------------------------------------- tech stack

function stack(t) {
  const gap = 20;
  const panelW = (W - INSET * 2 - gap) / 2;
  const panelH = 150;
  const H = 8 + panelH * 2 + gap + 18;
  const tile = 58;
  const icon = 34;

  let defs = '';
  let body = '';
  let order = 0;
  config.stack.forEach((group, gi) => {
    const px = INSET + (gi % 2) * (panelW + gap);
    const py = 8 + Math.floor(gi / 2) * (panelH + gap);
    const accent = t.accent[group.accent];
    const shell = cardShell({ id: `panel-${gi}`, x: px, y: py, w: panelW, h: panelH, theme: t, accent, glow: [panelW - 30, 0], glowRadius: 110 });
    defs += shell.defs;
    body += shell.body;
    body += `
<circle cx="${px + 28}" cy="${py + 29}" r="3.5" fill="${accent}"/>
<text class="mono" x="${px + 40}" y="${py + 33.5}" font-size="11.5" font-weight="700" letter-spacing="3" fill="${t.ink2}">${esc(group.title.toUpperCase())}</text>`;

    const slot = (panelW - 48) / group.items.length;
    group.items.forEach((item, i) => {
      const tx = px + 24 + i * slot + (slot - tile) / 2;
      const ty = py + 50;
      body += `
<g class="rise" style="animation-delay:${(order++ * 0.05).toFixed(2)}s">
  <rect x="${num(tx)}" y="${ty}" width="${tile}" height="${tile}" rx="16" fill="${t.raised}" stroke="${t.border}"/>
  ${brandIcon(item.icon, tx + (tile - icon) / 2, ty + (tile - icon) / 2, icon)}
  <text x="${num(tx + tile / 2)}" y="${ty + tile + 22}" text-anchor="middle" font-size="12.5" fill="${t.ink2}">${esc(item.name)}</text>
</g>`;
    });
  });

  const names = config.stack.flatMap((g) => g.items.map((i) => i.name)).join(', ');
  return svgDoc({ width: W, height: H, title: `Tech stack: ${names}`, style: RISE_STYLE + GLOW_STYLE, defs, body });
}

// ----------------------------------------------------------- project card

function projectCard(t, project) {
  const CW = 500;
  const H = 246;
  const x = INSET;
  const y = 8;
  const w = CW - INSET * 2;
  const h = 220;
  const [a, b] = project.accent;
  const accent = t.accent[a];

  const shell = cardShell({ id: 'card', x, y, w, h, theme: t, accent, glow: [w - 50, 10], glowRadius: 130 });
  const tile = iconTile({ id: 'tile', x: x + 24, y: y + 24, size: 50, radius: 14, from: SOLID[a], to: SOLID[b], icon: project.icon });
  const tags = chips(project.tags, { x: x + 24, y: y + 172, theme: t });

  const body = `
${shell.body}
${tile.body}
<text x="${x + 90}" y="${y + 47}" font-size="20" font-weight="700" fill="${t.ink}">${esc(project.name)}</text>
<text class="mono" x="${x + 90}" y="${y + 68}" font-size="12" fill="${t.muted}">${esc(project.repo)}</text>
<circle cx="${x + w - 42}" cy="${y + 49}" r="17" fill="${t.raised}" stroke="${t.border}"/>
${uiIcon('arrow-up-right', x + w - 50, y + 41, 16, t.ink2)}
${project.description
  .map((line, i) => `<text x="${x + 24}" y="${y + 106 + i * 22}" font-size="14" fill="${t.ink2}">${esc(line)}</text>`)
  .join('\n')}
${tags.svg}`;

  return svgDoc({
    width: CW,
    height: H,
    title: `${project.name}: ${project.description.join(' ')}`,
    style: GLOW_STYLE,
    defs: shell.defs + tile.defs,
    body,
  });
}

// ------------------------------------------------------ currently exploring

function exploring(t) {
  const gap = 20;
  const tileW = (W - INSET * 2 - gap) / 2;
  const tileH = 112;
  const H = 8 + tileH * 2 + gap + 18;

  let defs = '';
  let body = '';
  config.exploring.forEach((item, i) => {
    const x = INSET + (i % 2) * (tileW + gap);
    const y = 8 + Math.floor(i / 2) * (tileH + gap);
    const [a, b] = item.accent;
    const shell = cardShell({ id: `now-${i}`, x, y, w: tileW, h: tileH, theme: t, accent: t.accent[a], glow: [tileW - 20, tileH], glowRadius: 100 });
    const tile = iconTile({ id: `now-tile-${i}`, x: x + 22, y: y + 33, size: 46, radius: 13, from: SOLID[a], to: SOLID[b], icon: item.icon });
    defs += shell.defs + tile.defs;
    body += `
<g class="rise" style="animation-delay:${(i * 0.08).toFixed(2)}s">
${shell.body}
${tile.body}
<text x="${x + 86}" y="${y + 42}" font-size="16" font-weight="700" fill="${t.ink}">${esc(item.title)}</text>
${item.description
  .map((line, j) => `<text x="${x + 86}" y="${y + 66 + j * 20}" font-size="13.5" fill="${t.ink2}">${esc(line)}</text>`)
  .join('\n')}
</g>`;
  });

  const title = `Currently exploring: ${config.exploring.map((e) => e.title).join(', ')}`;
  return svgDoc({ width: W, height: H, title, style: RISE_STYLE + GLOW_STYLE, defs, body });
}

// ---------------------------------------------------------------- footer

function wavePath(period, amplitude, baseline, bottom) {
  let d = `M${-period} ${baseline}`;
  let first = true;
  for (let x = -period; x < W + period * 2; x += period / 2) {
    if (first) {
      d += ` Q${num(x + period / 4)} ${baseline - amplitude * 2} ${num(x + period / 2)} ${baseline}`;
      first = false;
    } else {
      d += ` T${num(x + period / 2)} ${baseline}`;
    }
  }
  return `${d} V${bottom} H${-period} Z`;
}

function footer(t) {
  const H = 170;
  const layers = [
    { period: 520, amplitude: 9, baseline: 118, speed: 18, opacity: t.name === 'dark' ? 0.22 : 0.14 },
    { period: 380, amplitude: 8, baseline: 132, speed: 13, opacity: t.name === 'dark' ? 0.3 : 0.18 },
    { period: 300, amplitude: 6, baseline: 146, speed: 9, opacity: t.name === 'dark' ? 0.42 : 0.24 },
  ];

  const style = `
${layers.map((l, i) => `.wave-${i} { animation: flow-${i} ${l.speed}s linear infinite; }\n@keyframes flow-${i} { to { transform: translateX(-${l.period}px); } }`).join('\n')}
.spark { transform-box: fill-box; transform-origin: center; animation: spin 14s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }`;

  const defs = `
<linearGradient id="wave" x1="0" y1="0" x2="${W}" y2="0" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="${t.gradient[0]}"/>
  <stop offset="0.5" stop-color="${t.gradient[1]}"/>
  <stop offset="1" stop-color="${t.gradient[2]}"/>
</linearGradient>
<linearGradient id="fade" x1="0" y1="100" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="#fff" stop-opacity="0.45"/>
  <stop offset="1" stop-color="#fff" stop-opacity="1"/>
</linearGradient>
<mask id="wave-mask"><rect x="0" y="0" width="${W}" height="${H}" fill="url(#fade)"/></mask>
<clipPath id="footer-frame"><rect x="${INSET}" y="-40" width="${W - INSET * 2}" height="${H - 6 + 40}" rx="26"/></clipPath>`;

  const body = `
<g class="spark">${uiIcon('sparkles', W / 2 - 12, 14, 24, t.accent.violet, 1.8)}</g>
<text x="${W / 2}" y="68" text-anchor="middle" font-size="15" fill="${t.ink2}">${esc(config.footer)}</text>
<g mask="url(#wave-mask)" clip-path="url(#footer-frame)">
${layers.map((l, i) => `  <path class="wave-${i}" d="${wavePath(l.period, l.amplitude, l.baseline, H)}" fill="url(#wave)" opacity="${l.opacity}"/>`).join('\n')}
</g>`;

  return svgDoc({ width: W, height: H, title: config.footer, style, defs, body });
}

// ------------------------------------------------------------------ build

mkdirSync(OUT, { recursive: true });
let count = 0;
const write = (name, svg) => {
  writeFileSync(new URL(name, OUT), svg);
  count++;
};

for (const t of Object.values(THEMES)) {
  write(`header-${t.name}.svg`, header(t));
  for (const [key, section] of Object.entries(config.sections)) {
    write(`title-${key}-${t.name}.svg`, sectionTitle(t, section));
  }
  write(`stack-${t.name}.svg`, stack(t));
  for (const project of config.projects) {
    write(`project-${project.id}-${t.name}.svg`, projectCard(t, project));
  }
  write(`exploring-${t.name}.svg`, exploring(t));
  write(`footer-${t.name}.svg`, footer(t));
}

console.log(`Wrote ${count} SVGs to assets/`);
