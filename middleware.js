const BOT_AGENTS =
  /bot|crawl|spider|facebookexternalhit|Twitterbot|LinkedInBot|Discordbot|Slackbot|WhatsApp|Telegram|Embedly|pinterest|W3C_Validator/i

export const config = {
  matcher: '/:path*',
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default async function middleware(request) {
  const url = new URL(request.url)
  const parts = url.hostname.split('.')

  // Only intercept subdomain profile pages (e.g. ibrahim.vinelink.xyz)
  if (parts.length < 3 || parts[0] === 'www') return

  const userAgent = request.headers.get('user-agent') || ''
  if (!BOT_AGENTS.test(userAgent)) return

  const username = parts[0]

  try {
    const res = await fetch(
      `${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&select=username,full_name,bio,avatar_url&limit=1`,
      {
        headers: {
          apikey: process.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
        },
      }
    )

    const profiles = await res.json()
    const profile = profiles?.[0]
    if (!profile) return

    const name = profile.full_name || `@${profile.username}`
    const title = profile.full_name
      ? `${profile.full_name} (@${profile.username}) | Vinelink`
      : `@${profile.username} | Vinelink`
    const description = profile.bio || `Check out ${profile.username}'s links on Vinelink`
    const image = profile.avatar_url || 'https://vinelink.xyz/og-default.png'
    const profileUrl = `https://${profile.username}.vinelink.xyz`

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />

  <!-- Open Graph -->
  <meta property="og:type" content="profile" />
  <meta property="og:site_name" content="Vinelink" />
  <meta property="og:url" content="${profileUrl}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
</head>
<body>
  <script>window.location.replace("${profileUrl}")</script>
  <p>Visit <a href="${profileUrl}">${escapeHtml(name)}'s Vinelink</a></p>
</body>
</html>`

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch {
    return
  }
}
