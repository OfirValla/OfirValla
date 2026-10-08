// Rewrites the "Recent activity" list in README.md (between the ACTIVITY
// markers) from the public events feed. Works without a token too, just with
// a lower rate limit.

import { readFileSync, writeFileSync } from 'node:fs';
import config from './profile.config.mjs';

const README = new URL('../README.md', import.meta.url);
const START = '<!-- ACTIVITY:START -->';
const END = '<!-- ACTIVITY:END -->';

const login = process.env.PROFILE_USER || config.username;
const token = process.env.GITHUB_TOKEN;

const response = await fetch(`https://api.github.com/users/${login}/events/public?per_page=100`, {
  headers: {
    Accept: 'application/vnd.github+json',
    'User-Agent': `${login}-profile-readme`,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
});
if (!response.ok) {
  console.error(`Events request failed: ${response.status} ${await response.text()}`);
  process.exit(1);
}
const events = await response.json();

const profileRepo = `${login}/${login}`.toLowerCase();
const day = (iso) => new Date(iso).toLocaleString('en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' });
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const repoLink = (fullName) => {
  const [owner, repo] = fullName.split('/');
  const label = owner.toLowerCase() === login.toLowerCase() ? repo : fullName;
  return `[${label}](https://github.com/${fullName})`;
};

function describe(event) {
  const p = event.payload ?? {};
  const repo = repoLink(event.repo.name);
  const base = `https://github.com/${event.repo.name}`;
  const pr = p.pull_request ?? {};
  const issue = p.issue ?? {};

  switch (event.type) {
    case 'CreateEvent':
      // Branch creation is skipped: it's mostly noise around pushes.
      if (p.ref_type === 'repository') return `✨ Created ${repo}`;
      if (p.ref_type === 'tag') return `🏷️ Tagged \`${p.ref}\` in ${repo}`;
      return null;
    case 'ReleaseEvent':
      if (p.action !== 'published' || !p.release) return null;
      return `🚀 Released [${p.release.tag_name}](${p.release.html_url}) of ${repo}`;
    case 'PullRequestEvent': {
      const n = p.number ?? pr.number;
      const link = `[#${n}](${pr.html_url ?? `${base}/pull/${n}`})`;
      if (p.action === 'opened') return `🔀 Opened PR ${link} in ${repo}`;
      if (p.action === 'closed' && pr.merged) return `🟣 Merged PR ${link} in ${repo}`;
      return null;
    }
    case 'PullRequestReviewEvent': {
      const n = pr.number;
      return n ? `👀 Reviewed PR [#${n}](${pr.html_url ?? `${base}/pull/${n}`}) in ${repo}` : null;
    }
    case 'IssuesEvent': {
      const link = `[#${issue.number}](${issue.html_url ?? `${base}/issues/${issue.number}`})`;
      if (p.action === 'opened') return `📌 Opened issue ${link} in ${repo}`;
      if (p.action === 'closed') return `✅ Closed issue ${link} in ${repo}`;
      return null;
    }
    case 'IssueCommentEvent':
      if (p.action !== 'created' || !issue.number) return null;
      return `💬 Commented on [#${issue.number}](${p.comment?.html_url ?? issue.html_url}) in ${repo}`;
    case 'WatchEvent':
      return `⭐ Starred ${repo}`;
    case 'ForkEvent':
      return `🍴 Forked ${repo}`;
    case 'PublicEvent':
      return `🌍 Open-sourced ${repo}`;
    default:
      return null;
  }
}

// The feed isn't strictly time-ordered, so sort it. Pushes to the same repo on
// the same day collapse into one line.
events.sort((a, b) => b.created_at.localeCompare(a.created_at));
const items = [];
const pushes = new Map();
for (const event of events) {
  if (event.repo.name.toLowerCase() === profileRepo) continue;
  const date = day(event.created_at);

  if (event.type === 'PushEvent') {
    // Newer API payloads omit commit counts; the line then just says "Pushed to".
    const commits = event.payload?.size ?? event.payload?.commits?.length;
    const key = `${event.repo.name}@${date}`;
    const seen = pushes.get(key);
    if (seen) {
      seen.commits = seen.commits == null || commits == null ? null : seen.commits + commits;
      continue;
    }
    const item = { push: true, repo: event.repo.name, date, commits };
    pushes.set(key, item);
    items.push(item);
    continue;
  }

  const text = describe(event);
  if (text) items.push({ date, text });
}

const lines = items.slice(0, config.activity.limit).map((item) => {
  const text = item.push
    ? `🔨 Pushed ${item.commits ? `${plural(item.commits, 'commit')} ` : ''}to ${repoLink(item.repo)}`
    : item.text;
  return `- \`${item.date}\` &nbsp;${text}`;
});
if (!lines.length) lines.push('- Nothing public lately. Probably heads-down on something private.');

const readme = readFileSync(README, 'utf8');
const start = readme.indexOf(START);
const end = readme.indexOf(END);
if (start === -1 || end === -1 || end < start) {
  console.error(`README.md needs ${START} and ${END} markers.`);
  process.exit(1);
}

const next = `${readme.slice(0, start + START.length)}\n${lines.join('\n')}\n${readme.slice(end)}`;
if (next === readme) {
  console.log('Activity unchanged.');
} else {
  writeFileSync(README, next);
  console.log(`Activity updated with ${lines.length} entries.`);
}
