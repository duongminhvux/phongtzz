const GENERIC_OR_LOCAL_FONTS = new Set([
  'arial',
  'georgia',
  'verdana',
  'tahoma',
  'trebuchet ms',
  'times new roman',
  'courier new',
  'system ui',
  'system-ui',
  'sans-serif',
  'serif',
  'monospace',
])

export function primaryFontName(stack?: string | null): string | null {
  if (!stack) return null
  const first = stack.split(',')[0]?.trim().replace(/^['"]|['"]$/g, '')
  return first || null
}

export function normalizeFontStack(value: string | undefined | null, fallback: string): string {
  const trimmed = (value || '').trim()
  if (!trimmed) return fallback
  const primary = primaryFontName(trimmed)
  if (!primary) return fallback
  if (trimmed.includes(',')) return trimmed
  const lower = primary.toLowerCase()
  if (lower === 'georgia' || lower === 'times new roman' || lower === 'serif') return `${primary}, serif`
  return `'${primary.replace(/'/g, "\\'")}', sans-serif`
}

export function ensureRemoteFonts(stacks: Array<string | undefined | null>) {
  if (typeof document === 'undefined') return
  const names = Array.from(new Set(stacks.map(primaryFontName).filter((name): name is string => Boolean(name))))
    .filter((name) => !GENERIC_OR_LOCAL_FONTS.has(name.toLowerCase()))
  if (!names.length) return

  const linkId = 'dynamic-google-fonts'
  let link = document.getElementById(linkId) as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.id = linkId
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }
  const query = names
    .map((name) => `family=${encodeURIComponent(name).replace(/%20/g, '+')}:wght@300;400;500;600;700;800`)
    .join('&')
  link.href = `https://fonts.googleapis.com/css2?${query}&display=swap`
}
