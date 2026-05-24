const EXTENSION_MAP: Record<string, string> = {
  ts: 'TypeScript',
  tsx: 'TypeScript (React)',
  js: 'JavaScript',
  jsx: 'JavaScript (React)',
  mjs: 'JavaScript (ESM)',
  cjs: 'JavaScript (CommonJS)',
  py: 'Python',
  rb: 'Ruby',
  go: 'Go',
  rs: 'Rust',
  java: 'Java',
  kt: 'Kotlin',
  swift: 'Swift',
  cs: 'C#',
  cpp: 'C++',
  cc: 'C++',
  cxx: 'C++',
  c: 'C',
  h: 'C/C++ Header',
  hpp: 'C++ Header',
  php: 'PHP',
  ex: 'Elixir',
  exs: 'Elixir',
  scala: 'Scala',
  clj: 'Clojure',
  cljs: 'ClojureScript',
  hs: 'Haskell',
  lua: 'Lua',
  r: 'R',
  jl: 'Julia',
  dart: 'Dart',
  vue: 'Vue',
  svelte: 'Svelte',
  astro: 'Astro',
  html: 'HTML',
  htm: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  sass: 'Sass',
  less: 'Less',
  sql: 'SQL',
  sh: 'Shell',
  bash: 'Bash',
  zsh: 'Zsh',
  fish: 'Fish',
  ps1: 'PowerShell',
  yaml: 'YAML',
  yml: 'YAML',
  json: 'JSON',
  jsonc: 'JSON with Comments',
  toml: 'TOML',
  xml: 'XML',
  graphql: 'GraphQL',
  gql: 'GraphQL',
  proto: 'Protobuf',
  tf: 'Terraform',
  hcl: 'HCL',
  dockerfile: 'Dockerfile',
  makefile: 'Makefile',
  md: 'Markdown',
  mdx: 'MDX',
}

export function detectLanguage(filePath: string): string {
  const filename = filePath.split('/').pop() ?? filePath
  const lower = filename.toLowerCase()

  if (lower === 'dockerfile') return 'Dockerfile'
  if (lower === 'makefile' || lower === 'gnumakefile') return 'Makefile'
  if (lower === 'gemfile' || lower === 'gemfile.lock') return 'Ruby'
  if (lower === 'rakefile') return 'Ruby'
  if (lower === 'brewfile') return 'Ruby'
  if (lower.endsWith('.config.js') || lower.endsWith('.config.ts')) return detectLanguage(lower.replace('.config', ''))

  const parts = filename.split('.')
  if (parts.length < 2) return 'Unknown'

  const ext = parts[parts.length - 1].toLowerCase()
  return EXTENSION_MAP[ext] ?? 'Unknown'
}

export function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    TypeScript: '#3178c6',
    'TypeScript (React)': '#3178c6',
    JavaScript: '#f7df1e',
    'JavaScript (React)': '#f7df1e',
    Python: '#3572a5',
    Ruby: '#cc342d',
    Go: '#00add8',
    Rust: '#dea584',
    Java: '#b07219',
    Kotlin: '#a97bff',
    Swift: '#f05138',
    'C#': '#178600',
    'C++': '#f34b7d',
    C: '#555555',
    PHP: '#4f5d95',
    Vue: '#41b883',
    Svelte: '#ff3e00',
    CSS: '#563d7c',
    SCSS: '#c6538c',
    HTML: '#e34c26',
    SQL: '#e38c00',
    Shell: '#89e051',
    GraphQL: '#e10098',
    Terraform: '#623ce4',
    Dockerfile: '#384d54',
  }
  return colors[language] ?? '#6b7280'
}
