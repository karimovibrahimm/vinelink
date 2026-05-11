import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import './Profile.css'

const themes = {
  default: { primary: '#1a3a2a', accent: '#c9a84c', bg: '#f7f5f0', bgGradient: '#e8f0eb' },
  ocean:   { primary: '#1a2e4a', accent: '#4a9eca', bg: '#f0f5fa', bgGradient: '#d8eaf5' },
  rose:    { primary: '#4a1a2e', accent: '#ca4a7a', bg: '#faf0f3', bgGradient: '#f5d8e3' },
  midnight:{ primary: '#1a1a2e', accent: '#7a6aca', bg: '#f0f0fa', bgGradient: '#dcdaf5' },
  sand:    { primary: '#3a2e1a', accent: '#ca9a4a', bg: '#faf5f0', bgGradient: '#f5ead8' },
  slate:   { primary: '#1a2a3a', accent: '#4acaca', bg: '#f0f5f5', bgGradient: '#d8f0f0' },
}

function Profile() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    getProfile()
  }, [username])

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

  if (loading) {
    return (
      <div className="profile__loading">
        <div className="profile__spinner"></div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="profile__notfound">
        <div className="profile__notfound-icon">🌿</div>
        <h1>Page not found</h1>
        <p>The Vinelink <strong>@{username}</strong> doesn't exist yet.</p>
        <a href="/signup" className="profile__notfound-btn">Create your own Vinelink</a>
        <a href="/" className="profile__notfound-home">← Back to Vinelink</a>
      </div>
    )
  }

  const theme = themes[profile.theme] || themes.default

  return (
    <div
      className="profile"
      style={{
        background: `linear-gradient(160deg, ${theme.bgGradient} 0%, ${theme.bg} 60%)`
      }}
    >

      {/* Background blobs */}
      <div
        className="profile__bg"
        style={{
          background: `
            radial-gradient(circle at 20% 20%, ${theme.primary}10 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, ${theme.accent}15 0%, transparent 50%)
          `
        }}
      ></div>

      <div className="profile__container">

        {/* Avatar */}
        <div
          className="profile__avatar"
          style={{
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`
          }}
        >
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} />
          ) : (
            <span>{profile.username?.[0]?.toUpperCase()}</span>
          )}
        </div>

        {/* Info */}
        <div className="profile__info">
          <h1
            className="profile__name"
            style={{ color: theme.primary }}
          >
            {profile.full_name || `@${profile.username}`}
          </h1>
          {profile.full_name && (
            <p className="profile__handle">@{profile.username}</p>
          )}
          {profile.bio && (
            <p className="profile__bio">{profile.bio}</p>
          )}
        </div>

        {/* Links */}
        <div className="profile__links">
          {links.length === 0 ? (
            <p className="profile__no-links">No links added yet.</p>
          ) : (
            links.map((link, index) => (
              <button
                key={link.id}
                className="profile__link"
                style={index === 0 ? {
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                  color: '#ffffff'
                } : {
                  backgroundColor: '#ffffff',
                  borderColor: `${theme.primary}22`,
                  color: theme.primary
                }}
                onClick={() => handleLinkClick(link)}
              >
                <span className="profile__link-title">{link.title}</span>
                <svg
                  className="profile__link-arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="profile__footer">
          <a href="/" className="profile__powered">
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