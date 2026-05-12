import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getThemeById } from '../../lib/themes'
import './Profile.css'

function Profile() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => { getProfile() }, [username])

  const getProfile = async () => {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !profileData) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setProfile(profileData)

    const { data: linksData } = await supabase
      .from('links')
      .select('*')
      .eq('user_id', profileData.id)
      .eq('active', true)
      .order('position', { ascending: true })

    if (linksData) setLinks(linksData)
    setLoading(false)
  }

  const handleLinkClick = async (link) => {
    await supabase.from('link_clicks').insert({
      link_id: link.id,
      user_id: profile.id,
      clicked_at: new Date().toISOString()
    })
    window.open(link.url, '_blank', 'noreferrer')
  }

  if (loading) return (
    <div className="profile__loading">
      <div className="profile__spinner"></div>
    </div>
  )

  if (notFound) return (
    <div className="profile__notfound">
      <div className="profile__notfound-icon">🌿</div>
      <h1>Page not found</h1>
      <p>The Vinelink <strong>@{username}</strong> doesn't exist yet.</p>
      <a href="/signup" className="profile__notfound-btn">Create your own Vinelink</a>
      <a href="/" className="profile__notfound-home">← Back to Vinelink</a>
    </div>
  )

  const theme = getThemeById(profile.theme)
  const isDark = theme.style === 'dark'
  const textColor = theme.textColor || theme.primary
  const subtextColor = theme.subtextColor || '#888888'

  const getBackground = () => {
    if (theme.id === 'aurora') {
      return `
        radial-gradient(ellipse at 20% 50%, rgba(100,255,218,0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(130,80,255,0.2) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 80%, rgba(0,200,255,0.1) 0%, transparent 50%),
        linear-gradient(160deg, #0a1628 0%, #0d2040 100%)
      `
    }
    if (theme.id === 'glass') {
      return `linear-gradient(135deg, #16213e 0%, #0f3460 50%, #1a1a2e 100%)`
    }
    if (theme.id === 'neon') {
      return `#0a0a0a`
    }
    if (theme.id === 'midnight') {
      return `radial-gradient(ellipse at 50% 0%, rgba(122,106,202,0.3) 0%, transparent 60%), #0d0d1a`
    }
    return `linear-gradient(160deg, ${theme.bgGradient} 0%, ${theme.bg} 60%)`
  }

  const getPatternOverlay = () => {
    if (theme.pattern === 'grid') {
      return (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(0,255,136,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}/>
      )
    }
    if (theme.pattern === 'dots') {
      return (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(214,51,132,0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}/>
      )
    }
    if (theme.pattern === 'stars') {
      return (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          backgroundPosition: '0 0, 40px 40px'
        }}/>
      )
    }
    return null
  }

  const getFontFamily = () => {
    if (theme.font === 'mono') return "'Courier New', monospace"
    if (theme.font === 'serif') return "Georgia, 'Times New Roman', serif"
    if (theme.font === 'rounded') return "'Trebuchet MS', system-ui, sans-serif"
    return "inherit"
  }

  const getLinkStyle = (index) => {
    const base = {
      fontFamily: getFontFamily(),
      transition: 'all 0.2s ease'
    }

    if (theme.id === 'neon') {
      return {
        ...base,
        background: index === 0 ? 'rgba(0,255,136,0.15)' : 'transparent',
        border: `1px solid ${index === 0 ? '#00ff88' : 'rgba(0,255,136,0.2)'}`,
        color: '#00ff88',
        boxShadow: index === 0 ? '0 0 20px rgba(0,255,136,0.3)' : 'none'
      }
    }
    if (theme.id === 'aurora' || theme.id === 'glass') {
      return {
        ...base,
        background: index === 0 ? 'rgba(100,255,218,0.15)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${index === 0 ? 'rgba(100,255,218,0.4)' : 'rgba(255,255,255,0.1)'}`,
        color: index === 0 ? theme.accent : '#ffffff',
        backdropFilter: 'blur(10px)'
      }
    }
    if (theme.id === 'midnight') {
      return {
        ...base,
        background: index === 0 ? 'rgba(122,106,202,0.3)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${index === 0 ? 'rgba(122,106,202,0.6)' : 'rgba(255,255,255,0.1)'}`,
        color: index === 0 ? '#fff' : 'rgba(255,255,255,0.8)',
        boxShadow: index === 0 ? '0 0 30px rgba(122,106,202,0.3)' : 'none'
      }
    }
    if (theme.id === 'paper') {
      return {
        ...base,
        background: index === 0 ? '#c0392b' : '#fffef9',
        border: `2px solid ${index === 0 ? '#c0392b' : '#d4c9b0'}`,
        color: index === 0 ? '#ffffff' : '#2c2c2c',
        borderRadius: '4px',
        boxShadow: '2px 2px 0px rgba(0,0,0,0.1)'
      }
    }
    if (theme.id === 'candy') {
      return {
        ...base,
        background: index === 0
          ? 'linear-gradient(135deg, #d63384, #fd7e14)'
          : '#ffffff',
        border: `2px solid ${index === 0 ? 'transparent' : '#f8b4d9'}`,
        color: index === 0 ? '#ffffff' : '#d63384',
        boxShadow: index === 0 ? '0 4px 15px rgba(214,51,132,0.4)' : 'none',
        borderRadius: '100px'
      }
    }

    return {
      ...base,
      backgroundColor: index === 0 ? theme.primary : theme.cardBg,
      borderColor: index === 0 ? theme.primary : (theme.borderColor || `${theme.primary}22`),
      color: index === 0 ? '#ffffff' : textColor
    }
  }

  return (
    <div
      className="profile"
      style={{ background: getBackground(), fontFamily: getFontFamily() }}
    >
      {getPatternOverlay()}

      <div className="profile__container" style={{ position: 'relative', zIndex: 1 }}>

        <div
          className="profile__avatar"
          style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}
        >
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} />
          ) : (
            <span>{profile.username?.[0]?.toUpperCase()}</span>
          )}
        </div>

        <div className="profile__info">
          <h1 className="profile__name" style={{ color: textColor }}>
            {profile.full_name || `@${profile.username}`}
          </h1>
          {profile.full_name && (
            <p className="profile__handle" style={{ color: subtextColor }}>@{profile.username}</p>
          )}
          {profile.bio && (
            <p className="profile__bio" style={{ color: subtextColor }}>{profile.bio}</p>
          )}
        </div>

        <div className="profile__links">
          {links.length === 0 ? (
            <p className="profile__no-links" style={{ color: subtextColor }}>No links added yet.</p>
          ) : (
            links.map((link, index) => (
              <button
                key={link.id}
                className="profile__link"
                style={getLinkStyle(index)}
                onClick={() => handleLinkClick(link)}
              >
                <span className="profile__link-title">{link.title}</span>
                <svg className="profile__link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            ))
          )}
        </div>

        <div className="profile__footer">
          <a href="/" className="profile__powered" style={isDark ? {
            background: 'rgba(255,255,255,0.08)',
            borderColor: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.4)'
          } : {}}>
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