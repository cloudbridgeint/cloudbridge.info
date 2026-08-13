/*
 * Fixed icon and colour sets for database-driven content.
 *
 * Two reasons this is a lookup table rather than a free text field:
 *
 * 1. An admin field that accepted raw SVG would let anyone with panel access
 *    put script on the public site. The database stores a key; the markup is
 *    written here.
 * 2. Tailwind only keeps classes it can see as complete strings, so a class
 *    built at runtime from a database value would silently render unstyled.
 *    Every class below is written out in full.
 */

/** Stroked line icons, 24x24 viewBox. Keys are stored in page_items.icon. */
export const ICONS: Record<string, { label: string; path: string }> = {
  'arrow-down-box': { label: 'Download / adapt', path: 'M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4' },
  'shield-x': { label: 'Shield', path: 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z' },
  chat: { label: 'Conversation', path: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.3-3.9A7.9 7.9 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  'grid-lines': { label: 'Analysis grid', path: 'M9 3v18M3 9h18M3 15h18' },
  users: { label: 'People', path: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-3.13a4 4 0 100-8 4 4 0 000 8zm7 3.13a4 4 0 00-3-3.87M6.5 9.13A4 4 0 1010 5' },
  kanban: { label: 'Project board', path: 'M9 17V7a2 2 0 012-2h2a2 2 0 012 2v10m-6 0h6m-6 0H5a2 2 0 01-2-2v-2a2 2 0 012-2h1m13 6h1a2 2 0 002-2v-2a2 2 0 00-2-2h-1' },
  cog: { label: 'Settings / technical', path: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  clock: { label: 'Time', path: 'M12 6v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  bulb: { label: 'Idea', path: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a4 4 0 115.657 0c-.63.63-1.172 1.34-1.172 2.243V19a1 1 0 01-1 1h-2a1 1 0 01-1-1v-.514c0-.903-.542-1.612-1.172-2.243z' },
  globe: { label: 'Globe', path: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.5 0 4.5-4 4.5-9S14.5 3 12 3s-4.5 4-4.5 9 2 9 4.5 9zM3.5 9h17M3.5 15h17' },
  cap: { label: 'Graduation cap', path: 'M12 4 3 8.5 12 13l9-4.5L12 4Zm-5.5 6.6V15c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3v-4.4' },
  coin: { label: 'Money', path: 'M12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zM9.5 14.2s.9 1.3 2.5 1.3 2.5-.8 2.5-1.7c0-2.4-5-1.1-5-3.5 0-.9 1-1.7 2.5-1.7s2.5 1.3 2.5 1.3M12 7.3v1.1M12 15.6v1.1' },
  trophy: { label: 'Award', path: 'M12 4v5.2M8.4 6.6 12 9.2l3.6-2.6M6 9.5v3.8c0 3.2 2.7 5.8 6 5.8s6-2.6 6-5.8V9.5M9.5 19.1 9 21m6-1.9.5 1.9' },
  card: { label: 'Card / fee', path: 'M5.5 6h13a2 2 0 012 2v8a2 2 0 01-2 2h-13a2 2 0 01-2-2V8a2 2 0 012-2zM3.5 10.5h17M7 14.2h4' },
  check: { label: 'Tick', path: 'M4.5 12.5l5 5 10-11' },
  plane: { label: 'Travel', path: 'M10.5 19.5l1.5-4.5 8-2.5a1.5 1.5 0 000-2.9l-8-2.6-1.5-4.5a1 1 0 00-1.9 0L7 7l-3.5 1a1 1 0 000 1.9L7 11l1.6 8.5a1 1 0 001.9 0z' },
  book: { label: 'Course', path: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s4.332.477 5.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  shield: { label: 'Visa / protection', path: 'M12 3l8 3.5v5c0 4.5-3.2 8.4-8 9.5-4.8-1.1-8-5-8-9.5v-5L12 3z' },
};

export const ICON_KEYS = Object.keys(ICONS);

/**
 * An icon may also be a picture the office uploaded, stored as "media:<id>" or
 * a path. Returns its URL, or '' when the value names one of the built-in
 * icons above. Uploads go through /api/media, which only accepts real image
 * types — SVG is refused there precisely because it can carry script.
 */
export function iconImage(value: string | null | undefined): string {
  const v = String(value || '').trim();
  if (!v) return '';
  if (v.startsWith('media:')) return `/api/media/${v.slice(6)}`;
  if (v.startsWith('/') || /^https?:\/\//i.test(v)) return v;
  return '';
}

export function iconPath(key: string | null | undefined, fallback = 'check'): string {
  const k = String(key || '').trim();
  return (ICONS[k] || ICONS[fallback]).path;
}

/**
 * Colour strips on cards. The admin picks a key; the class string lives here so
 * Tailwind's scanner sees it.
 */
export const ACCENTS: Record<string, { label: string; bar: string }> = {
  bridge: { label: 'Navy', bar: 'bg-bridge-700' },
  harbor: { label: 'Teal', bar: 'bg-harbor-500' },
  sunrise: { label: 'Red', bar: 'bg-sunrise-400' },
  slate: { label: 'Grey', bar: 'bg-slate-400' },
};

export const ACCENT_KEYS = Object.keys(ACCENTS);

export function accentBar(key: string | null | undefined): string {
  return (ACCENTS[String(key || '').trim()] || ACCENTS.bridge).bar;
}

/**
 * Destination card gradients come from the database and are written straight
 * into a style attribute, so the value is checked rather than trusted: two hex
 * colours separated by a comma, or the default. Anything else — including a
 * quote that would break out of the attribute — is discarded.
 */
export function safeGradient(value: string | null | undefined, fallback = '#2e4a7a,#4d70a8'): string {
  const v = String(value || '').trim();
  return /^#[0-9a-fA-F]{3,8},#[0-9a-fA-F]{3,8}$/.test(v) ? v : fallback;
}

/**
 * A value going inside `url('…')` in a style attribute. Quotes, parentheses,
 * backslashes and whitespace are removed rather than escaped: nothing legitimate
 * in an image path needs them, and any one of them would let a stored value
 * break out of the attribute.
 */
export function safeCssUrl(value: string | null | undefined): string {
  return String(value || '').replace(/["'()\\\s;]/g, '');
}
