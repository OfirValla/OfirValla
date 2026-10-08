// Everything the generated artwork says lives here. Edit, then run
// `npm run build` (or just push: the GitHub Action rebuilds on every push).
//
// Line breaks in descriptions are manual on purpose: SVG has no text wrapping,
// so keep project lines under ~58 characters and "exploring" lines under ~52.

export default {
  username: 'OfirValla',
  name: 'Ofir Valla',
  greeting: "Hi there, I'm",
  role: 'Full-Stack Developer',

  // Typed out one after another in the header, then erased.
  typing: [
    'building .NET backends and React frontends',
    'shipping Android apps with Flutter + Kotlin',
    'turning wall tablets into smart-home hubs',
    'training AI models on real-world data',
    'automating anything I do twice',
  ],

  sections: {
    stack: { label: 'Tech stack', caption: 'the tools I reach for most' },
    projects: { label: 'Featured projects', caption: 'things I built to scratch my own itch' },
    exploring: { label: 'Currently exploring', caption: "what I'm learning and tinkering with" },
    stats: { label: 'GitHub stats', caption: 'public repositories, refreshed by a GitHub Action' },
    activity: { label: 'Recent activity', caption: 'latest public events, updated every 6 hours' },
  },

  // Icons are file names in scripts/icons/brand (devicon, MIT).
  stack: [
    {
      title: 'Backend',
      accent: 'violet',
      items: [
        { name: 'C#', icon: 'csharp-original' },
        { name: '.NET', icon: 'dotnet' },
        { name: 'Node.js', icon: 'nodejs-original' },
        { name: 'Python', icon: 'python-original' },
      ],
    },
    {
      title: 'Frontend',
      accent: 'cyan',
      items: [
        { name: 'TypeScript', icon: 'typescript-original' },
        { name: 'React', icon: 'react-original' },
        { name: 'Tailwind', icon: 'tailwindcss-original' },
        { name: 'Vite', icon: 'vitejs-original' },
      ],
    },
    {
      title: 'Mobile',
      accent: 'pink',
      items: [
        { name: 'Flutter', icon: 'flutter-original' },
        { name: 'Dart', icon: 'dart-original' },
        { name: 'Kotlin', icon: 'kotlin-original' },
        { name: 'Android', icon: 'android-original' },
      ],
    },
    {
      title: 'Data & Cloud',
      accent: 'blue',
      items: [
        { name: 'PostgreSQL', icon: 'postgresql-original' },
        { name: 'Redis', icon: 'redis-original' },
        { name: 'Docker', icon: 'docker-original' },
        { name: 'AWS', icon: 'amazonwebservices-plain-wordmark' },
      ],
    },
  ],

  // One card each. `id` names the asset file; the README links each card to `repo`.
  // Icons are file names in scripts/icons/ui (lucide, ISC).
  projects: [
    {
      id: 'aura-display',
      name: 'Aura Display',
      repo: 'OfirValla/Wallflower',
      icon: 'tablet-smartphone',
      accent: ['cyan', 'blue'],
      description: [
        'Turns a wall-mounted Android tablet into an always-on,',
        'locked-down Home Assistant dashboard, with MQTT discovery',
        'and camera-based motion wake. Flutter UI, Kotlin core.',
      ],
      tags: ['Flutter', 'Kotlin', 'MQTT', 'Home Assistant'],
    },
    {
      id: 'credo',
      name: 'Credo',
      repo: 'OfirValla/Credo',
      icon: 'landmark',
      accent: ['emerald', 'cyan'],
      description: [
        'Plan, track and optimize mortgage and loan portfolios:',
        'month-by-month amortization, extra payments, rate changes',
        'and CPI-linked loans. All data stays in your browser.',
      ],
      tags: ['React', 'TypeScript', 'Tailwind', 'Recharts'],
    },
    {
      id: 'do-it',
      name: 'Do It',
      repo: 'OfirValla/do-it',
      icon: 'bell-ring',
      accent: ['pink', 'violet'],
      description: [
        "A reminder app that won't stop reminding you until it's",
        'done. Native alarms survive app kills, Doze and reboots,',
        'and can ring like an alarm clock until you tap Done.',
      ],
      tags: ['Flutter', 'Kotlin', 'Android'],
    },
    {
      id: 'labelstamp',
      name: 'LabelStamp',
      repo: 'OfirValla/LabelStamp',
      icon: 'stamp',
      accent: ['violet', 'blue'],
      description: [
        'Chrome extension that stamps the same labels onto every',
        'task in a Label Studio queue. It reads the project config,',
        'asks once, and labels the whole batch for you.',
      ],
      tags: ['JavaScript', 'Chrome Extension', 'Label Studio'],
    },
  ],

  exploring: [
    {
      title: 'Training AI models',
      icon: 'brain-circuit',
      accent: ['violet', 'pink'],
      description: ['Labeling real camera footage and training vision', 'models to understand what they see.'],
    },
    {
      title: 'Home Assistant',
      icon: 'house',
      accent: ['cyan', 'blue'],
      description: ['Wall dashboards, MQTT devices and automations that', 'keep the house running on its own.'],
    },
    {
      title: 'LLM agents',
      icon: 'bot',
      accent: ['pink', 'violet'],
      description: ['Multi-agent systems and personas that simulate how', 'a real audience thinks, argues and decides.'],
    },
    {
      title: 'Offline-first mobile',
      icon: 'radio',
      accent: ['emerald', 'cyan'],
      description: ['Phones that find each other and play together over', 'local radio. No internet, no server, no accounts.'],
    },
  ],

  stats: {
    // true counts private repos too; needs a PROFILE_TOKEN secret (see scripts/README.md).
    includePrivate: false,
    // Build/glue languages that would otherwise crowd out the real ones.
    excludeLanguages: ['HTML', 'CSS', 'Batchfile', 'PowerShell', 'Shell', 'Dockerfile', 'Makefile'],
  },

  activity: { limit: 8 },

  footer: 'Thanks for stopping by',
};
