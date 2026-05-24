const EXACT_IGNORE: Set<string> = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'npm-shrinkwrap.json',
  'Gemfile.lock',
  'Cargo.lock',
  'poetry.lock',
  'Pipfile.lock',
  'composer.lock',
  'mix.lock',
  'flake.lock',
  '.DS_Store',
  'Thumbs.db',
])

const IGNORE_EXTENSIONS: Set<string> = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp', 'tiff',
  'mp4', 'mov', 'avi', 'webm', 'mkv',
  'mp3', 'wav', 'ogg', 'flac',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'zip', 'tar', 'gz', 'bz2', 'rar', '7z',
  'exe', 'dll', 'so', 'dylib', 'bin',
  'class', 'jar', 'war', 'ear',
  'pyc', 'pyo', 'pyd',
  'o', 'obj', 'a', 'lib',
  'map',
])

const IGNORE_PREFIXES: string[] = [
  'dist/',
  'build/',
  '.next/',
  'out/',
  '__pycache__/',
  '.cache/',
  'coverage/',
  '.nyc_output/',
  'node_modules/',
  '.git/',
  'vendor/',
  '.venv/',
  'venv/',
  'env/',
  '.env/',
  'target/',
  'bin/',
  'obj/',
  'generated/',
  'gen/',
  'proto/',
  'migrations/',
  '.terraform/',
]

const IGNORE_SUFFIXES: string[] = [
  '.min.js',
  '.min.css',
  '.bundle.js',
  '.generated.ts',
  '.generated.js',
  '_pb.ts',
  '_pb.js',
  '.pb.go',
  '.d.ts',
]

export function shouldSkipFile(filePath: string): boolean {
  const filename = filePath.split('/').pop() ?? filePath

  if (EXACT_IGNORE.has(filename)) return true

  const parts = filename.split('.')
  if (parts.length >= 2) {
    const ext = parts[parts.length - 1].toLowerCase()
    if (IGNORE_EXTENSIONS.has(ext)) return true
  }

  const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath
  for (const prefix of IGNORE_PREFIXES) {
    if (normalizedPath.startsWith(prefix) || normalizedPath.includes(`/${prefix}`)) return true
  }

  for (const suffix of IGNORE_SUFFIXES) {
    if (filename.endsWith(suffix)) return true
  }

  return false
}

export function getSkipReason(filePath: string): string {
  const filename = filePath.split('/').pop() ?? filePath

  if (EXACT_IGNORE.has(filename)) return 'lock file'
  const parts = filename.split('.')
  if (parts.length >= 2) {
    const ext = parts[parts.length - 1].toLowerCase()
    if (IGNORE_EXTENSIONS.has(ext)) return 'binary or media file'
  }
  if (IGNORE_SUFFIXES.some(s => filename.endsWith(s))) return 'generated file'
  return 'build artifact'
}
