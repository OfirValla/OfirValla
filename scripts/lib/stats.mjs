// Turns GitHub GraphQL data into the two stats cards (activity + languages).
//
// Chart notes:
// - Weekly contributions are one series, so every bar uses one colour and the
//   card title names it. Only the peak week gets a direct label.
// - Languages are a part-to-whole bar capped at three named slots plus a grey
//   "Other". The three slot colours pass the all-pairs colour-blindness and
//   normal-vision checks on both card surfaces, and the legend always
//   prints names and percentages, so colour is never the only cue.
// - These are static images inside a README, so there is no hover layer; the
//   numbers the chart shows are printed on the card itself.

import { GLOW_STYLE, cardShell, esc, num, svgDoc } from './svg.mjs';

const CARD = { width: 500, height: 256, x: 14, y: 8, w: 472, h: 230 };
const PAD = 24;
const fmt = new Intl.NumberFormat('en-US');
const TOP_LANGUAGES = 3;

export function summarize(user, { username, excludeLanguages = [], includePrivate = false }) {
  const skip = new Set(excludeLanguages.map((l) => l.toLowerCase()));
  const repos = user.repositories.nodes.filter((r) => r.name.toLowerCase() !== username.toLowerCase());

  const bytes = new Map();
  for (const repo of repos) {
    for (const { size, node } of repo.languages.edges) {
      if (skip.has(node.name.toLowerCase())) continue;
      bytes.set(node.name, (bytes.get(node.name) ?? 0) + size);
    }
  }
  const totalBytes = [...bytes.values()].reduce((a, b) => a + b, 0);
  const languages = [...bytes.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, size]) => ({ name, share: totalBytes ? size / totalBytes : 0 }));

  const collection = user.contributionsCollection;
  const calendar = collection.contributionCalendar;
  const days = calendar.weeks.flatMap((w) => w.contributionDays);
  const weeks = calendar.weeks.map((w) => w.contributionDays.reduce((sum, d) => sum + d.contributionCount, 0));

  return {
    contributions: calendar.totalContributions,
    commits: collection.totalCommitContributions,
    activeDays: days.filter((d) => d.contributionCount > 0).length,
    bestStreak: longestStreak(days),
    repoCount: repos.length,
    repoNoun: includePrivate ? 'repo' : 'public repo',
    firstDay: days[0]?.date,
    weeks,
    languages,
  };
}

function longestStreak(days) {
  let best = 0;
  let run = 0;
  for (const day of days) {
    run = day.contributionCount > 0 ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

const monthYear = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

function header(t, title, caption) {
  const { x, y, w } = CARD;
  return `
<text x="${x + PAD}" y="${y + 40}" font-size="16" font-weight="700" fill="${t.ink}">${esc(title)}</text>
<text x="${x + w - PAD}" y="${y + 40}" text-anchor="end" font-size="12.5" fill="${t.muted}">${esc(caption)}</text>`;
}

// Bar anchored to the baseline with only its data end (the top) rounded.
function barPath(x, top, width, height, radius) {
  const r = Math.min(radius, width / 2, height);
  const bottom = top + height;
  return (
    `M${num(x)} ${num(bottom)} V${num(top + r)} Q${num(x)} ${num(top)} ${num(x + r)} ${num(top)} ` +
    `H${num(x + width - r)} Q${num(x + width)} ${num(top)} ${num(x + width)} ${num(top + r)} V${num(bottom)} Z`
  );
}

export function activityCard(t, s) {
  const { x, y, w, h } = CARD;
  const shell = cardShell({ id: 'activity', x, y, w, h, theme: t, accent: t.accent.violet, glow: [w - 40, 0] });

  const minis = [
    { value: fmt.format(s.commits), label: 'commits' },
    { value: fmt.format(s.activeDays), label: 'active days' },
    { value: fmt.format(s.bestStreak), unit: s.bestStreak === 1 ? ' day' : ' days', label: 'best streak' },
  ];
  const miniX = [x + 200, x + 284, x + 374];

  // Weekly bars.
  const left = x + PAD;
  const plotW = w - PAD * 2;
  const baseline = y + 192;
  const plotH = 50;
  const slot = plotW / s.weeks.length;
  const barW = Math.max(slot - 2, 1); // 2px surface gap between bars
  const max = Math.max(...s.weeks, 0);
  const peak = s.weeks.lastIndexOf(max);

  let bars = '';
  s.weeks.forEach((value, i) => {
    const bx = left + i * slot + (slot - barW) / 2;
    if (value === 0 || max === 0) {
      bars += `<rect x="${num(bx)}" y="${baseline - 2}" width="${num(barW)}" height="2" rx="1" fill="${t.hairline}"/>`;
      return;
    }
    const bh = Math.max((value / max) * plotH, 3);
    bars += `<path d="${barPath(bx, baseline - bh, barW, bh, 3)}" fill="${t.bars}"/>`;
  });

  let peakLabel = '';
  if (max > 0) {
    const px = Math.min(Math.max(left + peak * slot + slot / 2, left + 30), left + plotW - 30);
    peakLabel = `<text x="${num(px)}" y="${baseline - plotH - 8}" text-anchor="middle" font-size="11" fill="${t.ink2}">peak week: ${fmt.format(max)}</text>`;
  }

  const body = `
${shell.body}
${header(t, 'Activity', 'last 12 months')}
<text x="${x + PAD}" y="${y + 94}" font-size="38" font-weight="800" letter-spacing="-0.5" fill="${t.ink}">${fmt.format(s.contributions)}</text>
<text x="${x + PAD}" y="${y + 115}" font-size="12.5" fill="${t.muted}">contributions</text>
${minis
  .map(
    (m, i) => `<text x="${miniX[i]}" y="${y + 88}" font-size="20" font-weight="700" fill="${t.ink}">${esc(m.value)}${m.unit ? `<tspan font-size="12.5" font-weight="500" fill="${t.muted}">${m.unit}</tspan>` : ''}</text>
<text x="${miniX[i]}" y="${y + 109}" font-size="12" fill="${t.muted}">${m.label}</text>`,
  )
  .join('\n')}
${peakLabel}
${bars}
<rect x="${left}" y="${baseline}" width="${plotW}" height="1" fill="${t.border}"/>
<text x="${left}" y="${baseline + 20}" font-size="11.5" fill="${t.muted}">${s.firstDay ? esc(monthYear(s.firstDay)) : ''}</text>
<text x="${left + plotW}" y="${baseline + 20}" text-anchor="end" font-size="11.5" fill="${t.muted}">this week</text>`;

  const title =
    `GitHub activity in the last 12 months: ${fmt.format(s.contributions)} contributions, ` +
    `${fmt.format(s.commits)} commits, ${fmt.format(s.activeDays)} active days, best streak ${s.bestStreak} days`;
  return svgDoc({ width: CARD.width, height: CARD.height, title, style: GLOW_STYLE, defs: shell.defs, body });
}

export function languagesCard(t, s) {
  const { x, y, w, h } = CARD;
  const shell = cardShell({ id: 'languages', x, y, w, h, theme: t, accent: t.accent.cyan, glow: [w - 40, 0] });

  const named = s.languages.slice(0, TOP_LANGUAGES).map((l, i) => ({ ...l, color: t.series[i] }));
  const rest = s.languages.slice(TOP_LANGUAGES);
  const rows = [...named];
  if (rest.length) {
    rows.push({
      name: 'Other',
      share: rest.reduce((sum, l) => sum + l.share, 0),
      color: t.other,
      detail: rest.slice(0, 3).map((l) => l.name).join(', ') + (rest.length > 3 ? ` +${rest.length - 3}` : ''),
    });
  }

  const left = x + PAD;
  const barW = w - PAD * 2;
  const barY = y + 62;
  const barH = 12;
  const gaps = Math.max(rows.length - 1, 0) * 2; // 2px surface gap between segments
  let cursor = left;
  const segments = rows
    .map((row) => {
      const segW = Math.max(row.share * (barW - gaps), 2);
      const rect = `<rect x="${num(cursor)}" y="${barY}" width="${num(segW)}" height="${barH}" fill="${row.color}"/>`;
      cursor += segW + 2;
      return rect;
    })
    .join('');

  const pct = (share) => `${(share * 100).toFixed(1)}%`;
  const legend = rows
    .map((row, i) => {
      const ry = y + 106 + i * 30;
      return `<rect x="${left}" y="${ry - 10}" width="11" height="11" rx="3" fill="${row.color}"/>
<text x="${left + 22}" y="${ry}" font-size="14" fill="${t.ink}">${esc(row.name)}${row.detail ? `<tspan dx="10" font-size="12.5" fill="${t.muted}">${esc(row.detail)}</tspan>` : ''}</text>
<text x="${left + barW}" y="${ry}" text-anchor="end" font-size="14" fill="${t.ink2}" style="font-variant-numeric: tabular-nums">${pct(row.share)}</text>`;
    })
    .join('\n');

  const defs = `${shell.defs}
<clipPath id="lang-bar"><rect x="${left}" y="${barY}" width="${barW}" height="${barH}" rx="${barH / 2}"/></clipPath>`;

  const repos = `across ${s.repoCount} ${s.repoNoun}${s.repoCount === 1 ? '' : 's'}`;
  const body = `
${shell.body}
${header(t, 'Languages', repos)}
${rows.length ? `<g clip-path="url(#lang-bar)">${segments}</g>` : ''}
${rows.length ? legend : `<text x="${left}" y="${y + 106}" font-size="14" fill="${t.muted}">No language data yet</text>`}`;

  const title = `Most used languages ${repos}: ${rows.map((r) => `${r.name} ${pct(r.share)}`).join(', ')}`;
  return svgDoc({ width: CARD.width, height: CARD.height, title, style: GLOW_STYLE, defs, body });
}
