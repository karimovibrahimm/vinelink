const ICONS = {
  instagram: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none"/>
    </svg>
  ),
  youtube: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="4"/>
      <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none"/>
    </svg>
  ),
  tiktok: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8.3a5 5 0 0 1-4-4.5v11a3.5 3.5 0 1 1-3-3.46"/>
      <path d="M16 8.3c.83.5 1.9.8 3 .8"/>
    </svg>
  ),
  twitter: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="4" x2="20" y2="20"/>
      <line x1="20" y1="4" x2="4" y2="20"/>
    </svg>
  ),
  facebook: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4h-2a4 4 0 0 0-4 4v3H6v3h3v7h3v-7h3l1-3h-4V8a1 1 0 0 1 1-1h3z"/>
    </svg>
  ),
  linkedin: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <line x1="8" y1="11" x2="8" y2="16"/>
      <circle cx="8" cy="7.5" r="0.6" fill="currentColor" stroke="none"/>
      <path d="M12 16v-3a2 2 0 0 1 4 0v3"/>
      <line x1="12" y1="11" x2="12" y2="16"/>
    </svg>
  ),
  github: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2-.2 4-1 4-4.5 0-1-.4-2-1-2.7.1-.3.4-1.4 0-3 0 0-1.3-.5-3.4 1a11 11 0 0 0-6.2 0c-2.1-1.5-3.4-1-3.4-1-.4 1.6-.1 2.7 0 3-.6.7-1 1.7-1 2.7 0 3.5 2 4.3 4 4.5-.6.6-.6 1.2-.5 2V19"/>
    </svg>
  ),
  spotify: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M7.5 9.5c3-1 6.5-1 9 .5"/>
      <path d="M8 13c2.3-.7 5-.7 7 .5"/>
      <path d="M9 16.2c1.6-.5 3.4-.5 4.8.3"/>
    </svg>
  ),
  twitch: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 3h16v11l-4 4h-4l-2 2H8v-2H4z"/>
      <line x1="13" y1="7" x2="13" y2="12"/>
      <line x1="17" y1="7" x2="17" y2="12"/>
    </svg>
  ),
  discord: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 7.5c3.3-1 6.7-1 10 0l1.5 8.5c-1.3.8-2.7 1.4-4.2 1.7l-.6-1.3c-1.1.3-2.4.3-3.5 0l-.6 1.3c-1.5-.3-2.9-.9-4.2-1.7L7 7.5z"/>
      <circle cx="9.5" cy="12.5" r="1" fill="currentColor" stroke="none"/>
      <circle cx="14.5" cy="12.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  ),
  whatsapp: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4 8.5 8.5 0 0 1-4.1-1L3 20l1.1-4.9A8.5 8.5 0 1 1 21 11.5z"/>
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5"/>
    </svg>
  ),
  telegram: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 4L3 11l6 2.5M21 4l-3 17-6-5.5M21 4L9 13.5V19l3-2.5"/>
    </svg>
  ),
  pinterest: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M9 19l3-10"/>
      <path d="M10 12a2.5 2.5 0 1 1 4.5-1.5c0 2-2 3.5-3.5 2"/>
    </svg>
  ),
  snapchat: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c3 0 5 2.3 5 5.5 0 1 0 2 .3 2.7.4.8 1.5 1 2.2 1.2-.2.7-1.2 1.1-1.8 1.4.2.5.5.9.5 1.4-1 .3-1.8.2-2.5.6-.5.3-.7 1-1.5 1.4-.7.4-1.6-.2-2.7-.2s-2 .6-2.7.2c-.8-.4-1-.1-1.5-1.4-.7-.4-1.5-.3-2.5-.6 0-.5.3-.9.5-1.4-.6-.3-1.6-.7-1.8-1.4.7-.2 1.8-.4 2.2-1.2.3-.7.3-1.7.3-2.7C7 5.3 9 3 12 3z"/>
    </svg>
  ),
  reddit: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="7"/>
      <circle cx="9" cy="13" r="1" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="13" r="1" fill="currentColor" stroke="none"/>
      <path d="M9 16c1.5 1 4.5 1 6 0"/>
      <circle cx="18" cy="8" r="1.5"/>
      <line x1="12" y1="6" x2="16.5" y2="8"/>
      <circle cx="12" cy="5" r="1"/>
    </svg>
  ),
  threads: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c4 0 6.5 2.7 6.5 7 0 5-2 9.5-6.8 9.5-3 0-4.7-1.6-4.7-3.7 0-2.4 2-3.6 5-3.6 1.5 0 2.7.3 3.5.7"/>
      <path d="M13 9.5c-3 0-4.5 1.3-4.5 3.2"/>
    </svg>
  ),
  email: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2"/>
      <path d="M3 7l9 6 9-6"/>
    </svg>
  ),
}

const DOMAIN_MAP = [
  [/instagram\.com/i, 'instagram'],
  [/(youtube\.com|youtu\.be)/i, 'youtube'],
  [/tiktok\.com/i, 'tiktok'],
  [/(twitter\.com|x\.com)/i, 'twitter'],
  [/(facebook\.com|fb\.com)/i, 'facebook'],
  [/linkedin\.com/i, 'linkedin'],
  [/github\.com/i, 'github'],
  [/spotify\.com/i, 'spotify'],
  [/twitch\.tv/i, 'twitch'],
  [/discord\.(gg|com)/i, 'discord'],
  [/(wa\.me|whatsapp\.com)/i, 'whatsapp'],
  [/(t\.me|telegram\.(org|me))/i, 'telegram'],
  [/pinterest\.com/i, 'pinterest'],
  [/snapchat\.com/i, 'snapchat'],
  [/reddit\.com/i, 'reddit'],
  [/threads\.net/i, 'threads'],
]

// Returns an SVG icon element for a known platform based on the link URL, or null.
export function getLinkIcon(url, size = 18) {
  if (!url) return null
  if (url.startsWith('mailto:')) return ICONS.email(size)
  for (const [pattern, key] of DOMAIN_MAP) {
    if (pattern.test(url)) return ICONS[key](size)
  }
  return null
}
