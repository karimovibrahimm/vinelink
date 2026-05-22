import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getThemeById } from '../../lib/themes'
import './Profile.css'

// ─── Newsletter subscriber helper ────────────────────────────────────────────
async function subscribeEmail(blockId, userId, email) {
  return supabase.from('newsletter_subscribers').insert({ block_id: blockId, user_id: userId, email })
}

// ─── Video embed URL parser ───────────────────────────────────────────────────
const getEmbedUrl = (url) => {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

const getSpotifyEmbedUrl = (url) => {
  if (!url) return null
  const match = url.match(/open\.spotify\.com\/(?:[^/]+\/)?(track|album|playlist|episode|show|artist)\/([^?&/]+)/)
  if (match) return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator`
  return null
}

// ─── Block renderers ──────────────────────────────────────────────────────────
function BlockLink({ block, theme, textColor }) {
  const getLinkStyle = () => {
    const base = { transition: 'all 0.2s ease' }
    if (theme.id === 'neon') return { ...base, background: 'rgba(0,255,136,0.15)', border: '1px solid #00ff88', color: '#00ff88', boxShadow: '0 0 20px rgba(0,255,136,0.3)' }
    if (theme.id === 'aurora' || theme.id === 'glass') return { ...base, background: 'rgba(100,255,218,0.15)', border: '1px solid rgba(100,255,218,0.4)', color: theme.accent, backdropFilter: 'blur(10px)' }
    if (theme.id === 'midnight') return { ...base, background: 'rgba(122,106,202,0.3)', border: '1px solid rgba(122,106,202,0.6)', color: '#fff', boxShadow: '0 0 30px rgba(122,106,202,0.3)' }
    if (theme.id === 'paper') return { ...base, background: theme.primary, border: `2px solid ${theme.primary}`, color: '#ffffff', borderRadius: '4px', boxShadow: '2px 2px 0px rgba(0,0,0,0.1)' }
    if (theme.id === 'candy') return { ...base, background: 'linear-gradient(135deg, #d63384, #fd7e14)', border: '2px solid transparent', color: '#ffffff', boxShadow: '0 4px 15px rgba(214,51,132,0.4)', borderRadius: '100px' }
    return { ...base, backgroundColor: theme.primary, borderColor: theme.primary, color: '#ffffff' }
  }
  return (
    <a
      className="profile__link"
      style={getLinkStyle()}
      href={block.data.url}
      target="_blank"
      rel="noreferrer noopener"
    >
      <span className="profile__link-title">{block.data.title || 'Link'}</span>
      <svg className="profile__link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    </a>
  )
}

function BlockText({ block, textColor, subtextColor }) {
  return (
    <div className="profile__block-text">
      {block.data.heading && <h2 className="profile__block-heading" style={{ color: textColor }}>{block.data.heading}</h2>}
      {block.data.body    && <p  className="profile__block-body"    style={{ color: subtextColor }}>{block.data.body}</p>}
    </div>
  )
}

function BlockImage({ block }) {
  const img = <img src={block.data.url} alt={block.data.caption || ''} className="profile__block-img" />
  return (
    <div className="profile__block-image">
      {block.data.link ? <a href={block.data.link} target="_blank" rel="noreferrer">{img}</a> : img}
      {block.data.caption && <p className="profile__block-caption">{block.data.caption}</p>}
    </div>
  )
}

function BlockVideo({ block }) {
  const embedUrl = getEmbedUrl(block.data.url)
  if (!embedUrl) return null
  return (
    <div className="profile__block-video">
      {block.data.title && <p className="profile__block-video-title">{block.data.title}</p>}
      <div className="profile__block-video-wrap">
        <iframe src={embedUrl} title={block.data.title || 'Video'} frameBorder="0" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
      </div>
    </div>
  )
}

function BlockSpotify({ block }) {
  const embedUrl = getSpotifyEmbedUrl(block.data.url)
  if (!embedUrl) return null
  return (
    <div className="profile__block-spotify">
      {block.data.title && <p className="profile__block-spotify-title">{block.data.title}</p>}
      <iframe
        style={{ borderRadius: '12px' }}
        src={embedUrl}
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title={block.data.title || 'Spotify'}
      />
    </div>
  )
}

function BlockNewsletter({ block, userId, theme }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) return
    setStatus('loading')
    const { error } = await subscribeEmail(block.id, userId, email)
    setStatus(error ? 'error' : 'success')
  }

  return (
    <div className="profile__block-newsletter" style={{ borderColor: theme.primary + '33', background: theme.cardBg || '#fff' }}>
      <div className="profile__block-nl-heading" style={{ color: theme.textColor || theme.primary }}>
        {block.data.heading || 'Join my newsletter'}
      </div>
      {block.data.subheading && (
        <div className="profile__block-nl-sub" style={{ color: theme.subtextColor || '#888' }}>
          {block.data.subheading}
        </div>
      )}
      {status === 'success' ? (
        <div className="profile__block-nl-success">✅ You're subscribed!</div>
      ) : (
        <div className="profile__block-nl-form">
          <input
            className="profile__block-nl-input"
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <button
            className="profile__block-nl-btn"
            style={{ background: theme.primary, color: '#fff' }}
            onClick={handleSubmit}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? '...' : (block.data.button_text || 'Subscribe')}
          </button>
        </div>
      )}
      {status === 'error' && <div className="profile__block-nl-error">Something went wrong. Try again.</div>}
    </div>
  )
}

// ─── Main Profile component ───────────────────────────────────────────────────
function Profile({ customUsername }) {
  const { username: paramUsername } = useParams()
  const username = customUsername || paramUsername

  const [profile, setProfile] = useState(null)
  const [links, setLinks]     = useState([])
  const [blocks, setBlocks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => { loadProfile() }, [username])

  const loadProfile = async () => {
    const { data: profileData, error } = await supabase
      .from('profiles').select('*').eq('username', username).single()
    if (error || !profileData) { setNotFound(true); setLoading(false); return }

    setProfile(profileData)

    const [{ data: linksData }, { data: blocksData }] = await Promise.all([
      supabase.from('links').select('*').eq('user_id', profileData.id).eq('active', true).order('position', { ascending: true }),
      supabase.from('blocks').select('*').eq('user_id', profileData.id).eq('active', true).order('position', { ascending: true }),
    ])

    if (linksData)  setLinks(linksData)
    if (blocksData) setBlocks(blocksData)

    const title = profileData.full_name
      ? `${profileData.full_name} (@${profileData.username}) | Vinelink`
      : `@${profileData.username} | Vinelink`
    const desc = profileData.bio || `Check out ${profileData.username}'s links on Vinelink.`
    document.title = title
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.content = desc

    setLoading(false)
  }

  // Fire-and-forget click tracking — never blocks navigation on any browser
  const trackLinkClick = (linkId) => {
    if (!profile) return
    supabase.from('link_clicks').insert({
      link_id: linkId,
      user_id: profile.id,
      clicked_at: new Date().toISOString()
    }).catch(() => {})
  }

  if (loading) return (
    <div className="profile__loading">
      <div style={{ width: '100%', maxWidth: 420, padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div className="sk" style={{ width: 88, height: 88, borderRadius: '50%' }}/>
        <div className="sk" style={{ width: 180, height: 22 }}/>
        <div className="sk" style={{ width: 260, height: 14 }}/>
        <div className="sk" style={{ width: 240, height: 14 }}/>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="sk" style={{ width: '100%', height: 52, borderRadius: 12 }}/>
        ))}
      </div>
    </div>
  )

  if (notFound) {
    const parts = window.location.hostname.split('.')
    const isSubdomain = parts.length >= 3 && parts[0] !== 'www'
    const mainUrl = isSubdomain
      ? `https://${parts.slice(1).join('.')}`
      : window.location.origin

    return (
      <div className="profile__notfound">
        <div className="profile__notfound-icon">🌿</div>
        <h1>Page not found</h1>
        <p>The Vinelink <strong>@{username}</strong> doesn't exist yet.</p>
        <a href={`${mainUrl}/signup`} className="profile__notfound-btn">Create your own Vinelink</a>
        <a href={mainUrl} className="profile__notfound-home">← Back to Vinelink</a>
      </div>
    )
  }

  const theme = getThemeById(profile.theme)
  const isDark = theme.style === 'dark'
  const textColor = theme.textColor || theme.primary
  const subtextColor = theme.subtextColor || '#888888'

  const getBackground = () => {
    if (theme.id === 'aurora')   return `radial-gradient(ellipse at 20% 50%, rgba(100,255,218,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(130,80,255,0.2) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(0,200,255,0.1) 0%, transparent 50%), linear-gradient(160deg, #0a1628 0%, #0d2040 100%)`
    if (theme.id === 'glass')    return `linear-gradient(135deg, #16213e 0%, #0f3460 50%, #1a1a2e 100%)`
    if (theme.id === 'neon')     return `#0a0a0a`
    if (theme.id === 'midnight') return `radial-gradient(ellipse at 50% 0%, rgba(122,106,202,0.3) 0%, transparent 60%), #0d0d1a`
    return `linear-gradient(160deg, ${theme.bgGradient} 0%, ${theme.bg} 60%)`
  }

  const getPatternOverlay = () => {
    if (theme.pattern === 'grid')  return <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(0,255,136,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}/>
    if (theme.pattern === 'dots')  return <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, rgba(214,51,132,0.15) 1px, transparent 1px)', backgroundSize: '24px 24px' }}/>
    if (theme.pattern === 'stars') return <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '80px 80px', backgroundPosition: '0 0, 40px 40px' }}/>
    return null
  }

  const getFontFamily = () => {
    if (theme.font === 'mono')    return "'Courier New', monospace"
    if (theme.font === 'serif')   return "Georgia, 'Times New Roman', serif"
    if (theme.font === 'rounded') return "'Trebuchet MS', system-ui, sans-serif"
    return "inherit"
  }

  const getLinkStyle = (index) => {
    const base = { fontFamily: getFontFamily(), transition: 'all 0.2s ease' }
    if (theme.id === 'neon')     return { ...base, background: index === 0 ? 'rgba(0,255,136,0.15)' : 'transparent', border: `1px solid ${index === 0 ? '#00ff88' : 'rgba(0,255,136,0.2)'}`, color: '#00ff88', boxShadow: index === 0 ? '0 0 20px rgba(0,255,136,0.3)' : 'none' }
    if (theme.id === 'aurora' || theme.id === 'glass') return { ...base, background: index === 0 ? 'rgba(100,255,218,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${index === 0 ? 'rgba(100,255,218,0.4)' : 'rgba(255,255,255,0.1)'}`, color: index === 0 ? theme.accent : '#ffffff', backdropFilter: 'blur(10px)' }
    if (theme.id === 'midnight') return { ...base, background: index === 0 ? 'rgba(122,106,202,0.3)' : 'rgba(255,255,255,0.05)', border: `1px solid ${index === 0 ? 'rgba(122,106,202,0.6)' : 'rgba(255,255,255,0.1)'}`, color: index === 0 ? '#fff' : 'rgba(255,255,255,0.8)', boxShadow: index === 0 ? '0 0 30px rgba(122,106,202,0.3)' : 'none' }
    if (theme.id === 'paper')    return { ...base, background: index === 0 ? '#c0392b' : '#fffef9', border: `2px solid ${index === 0 ? '#c0392b' : '#d4c9b0'}`, color: index === 0 ? '#ffffff' : '#2c2c2c', borderRadius: '4px', boxShadow: '2px 2px 0px rgba(0,0,0,0.1)' }
    if (theme.id === 'candy')    return { ...base, background: index === 0 ? 'linear-gradient(135deg, #d63384, #fd7e14)' : '#ffffff', border: `2px solid ${index === 0 ? 'transparent' : '#f8b4d9'}`, color: index === 0 ? '#ffffff' : '#d63384', boxShadow: index === 0 ? '0 4px 15px rgba(214,51,132,0.4)' : 'none', borderRadius: '100px' }
    return { ...base, backgroundColor: index === 0 ? theme.primary : theme.cardBg, borderColor: index === 0 ? theme.primary : (theme.borderColor || `${theme.primary}22`), color: index === 0 ? '#ffffff' : textColor }
  }

  const renderBlock = (block) => {
    switch (block.type) {
      case 'link':
        return <BlockLink key={block.id} block={block} theme={theme} textColor={textColor} />
      case 'text':
        return <BlockText key={block.id} block={block} textColor={textColor} subtextColor={subtextColor} />
      case 'image':
        return <BlockImage key={block.id} block={block} />
      case 'video':
        return <BlockVideo key={block.id} block={block} />
      case 'newsletter':
        return <BlockNewsletter key={block.id} block={block} userId={profile.id} theme={theme} />
      case 'spotify':
        return <BlockSpotify key={block.id} block={block} />
      default:
        return null
    }
  }

  return (
    <div className="profile" style={{ background: getBackground(), fontFamily: getFontFamily() }}>
      {getPatternOverlay()}

      <div className="profile__container" style={{ position: 'relative', zIndex: 1 }}>

        {/* Avatar */}
        <div className="profile__avatar" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.username} />
            : <span>{profile.username?.[0]?.toUpperCase()}</span>
          }
        </div>

        {/* Name / handle / bio */}
        <div className="profile__info">
          <h1 className="profile__name" style={{ color: textColor }}>{profile.full_name || `@${profile.username}`}</h1>
          {profile.full_name && <p className="profile__handle" style={{ color: subtextColor }}>@{profile.username}</p>}
          {profile.bio && <p className="profile__bio" style={{ color: subtextColor }}>{profile.bio}</p>}
        </div>

        {/* Links — native <a> tags work correctly on iOS Safari */}
        {links.length > 0 && (
          <div className="profile__links">
            {links.map((link, index) => (
              <a
                key={link.id}
                className="profile__link"
                style={getLinkStyle(index)}
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                onClick={() => trackLinkClick(link.id)}
              >
                <span className="profile__link-title">{link.title}</span>
                <svg className="profile__link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
            ))}
          </div>
        )}

        {/* Creator Blocks */}
        {blocks.length > 0 && (
          <div className="profile__blocks">
            {blocks.map(block => renderBlock(block))}
          </div>
        )}

        {links.length === 0 && blocks.length === 0 && (
          <p className="profile__no-links" style={{ color: subtextColor }}>No links added yet.</p>
        )}

        {/* Footer */}
        <div className="profile__footer">
          <a href="https://vinelink.xyz" className="profile__powered" style={isDark ? { background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' } : {}}>
            <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
              <path d="M14 4 C14 4 8 8 8 14 C8 18 10 21 14 24 C18 21 20 18 20 14 C20 8 14 4 14 4Z" fill="#c9a84c"/>
              <path d="M14 24 C14 24 10 20 8 16 C10 17 13 17 14 24Z" fill="#1a3a2a"/>
              <path d="M14 24 C14 24 18 20 20 16 C18 17 15 17 14 24Z" fill="#1a3a2a"/>
            </svg>
            Powered by Vinelink
          </a>
        </div>

      </div>
    </div>
  )
}

export default Profile