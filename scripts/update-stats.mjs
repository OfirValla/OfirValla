// Fetches profile stats from the GitHub GraphQL API and renders the two stats
// cards into assets/. Needs GITHUB_TOKEN (the Action's built-in token is enough
// for public data).

import { writeFileSync } from 'node:fs';
import config from './profile.config.mjs';
import { activityCard, languagesCard, summarize } from './lib/stats.mjs';
import { THEMES } from './lib/theme.mjs';

const QUERY = `
query ($login: String!, $privacy: RepositoryPrivacy) {
  user(login: $login) {
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: $privacy) {
      nodes {
        name
        languages(first: 15, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name } }
        }
      }
    }
    contributionsCollection {
      totalCommitContributions
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

const token = process.env.GITHUB_TOKEN;
const login = process.env.PROFILE_USER || config.username;
if (!token) {
  console.error('GITHUB_TOKEN is not set. Create a token with read access to public data and export it first.');
  process.exit(1);
}

const response = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: {
    Authorization: `bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': `${login}-profile-readme`,
  },
  body: JSON.stringify({
    query: QUERY,
    variables: { login, privacy: config.stats.includePrivate ? null : 'PUBLIC' },
  }),
});
const payload = await response.json();
if (!response.ok || payload.errors) {
  console.error('GitHub GraphQL request failed:', JSON.stringify(payload.errors ?? payload, null, 2));
  process.exit(1);
}

const stats = summarize(payload.data.user, {
  username: login,
  excludeLanguages: config.stats.excludeLanguages,
  includePrivate: config.stats.includePrivate,
});

for (const theme of Object.values(THEMES)) {
  writeFileSync(new URL(`../assets/stats-activity-${theme.name}.svg`, import.meta.url), activityCard(theme, stats));
  writeFileSync(new URL(`../assets/stats-languages-${theme.name}.svg`, import.meta.url), languagesCard(theme, stats));
}

console.log(
  `Stats: ${stats.contributions} contributions, ${stats.commits} commits, ` +
    `${stats.languages.length} languages across ${stats.repoCount} repos`,
);
