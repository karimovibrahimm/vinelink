import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

let template
try {
  template = readFileSync(join(__dirname, '..', 'dist', 'index.html'), 'utf8')
} catch {
  template = null
}

export default async function handler(req, res) {
  const host     = req.headers.host || ''
  const username = host.split('.')[0]

  if (!username || username === 'www') {
    res.status(404).end()
    return
  }

  let html = template

  try {
    const response = await fetch(
      `${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&select=username,full_name,bio,avatar_url&limit=1`,
      {
        headers: {
          apikey:        process.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
        },
      }
    )

    const profiles = await response.json()
    const profile  = profiles?.[0]

    if (profile && html) {
      const title      = profile.full_name
        ? `${profile.full_name} (@${profile.username}) | Vinelink`
        : `@${profile.username} | Vinelink`
      const description = profile.bio || `Check out ${profile.username}'s links on Vinelink`
      const image       = profile.avatar_url || 'https://vinelink.xyz/og-default.png'
      const profileUrl  = `https://${profile.username}.vinelink.xyz`

      const ogTags = `
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="profile" />
  <meta property="og:site_name" content="Vinelink" />
  <meta property="og:url" content="${profileUrl}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />`

      html = html
        .replace('<title>vinelink</title>', `<title>${escapeHtml(title)}</title>`)
        .replace('</head>', `${ogTags}\n</head>`)
    }
  } catch {
    // serve unmodified index.html on error
  }

  if (!html) { res.status(500).end(); return }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(html)
}
