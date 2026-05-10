import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import './Profile.css'

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

  const handleLinkClick = (url) => {
    window.open(url, '_blank', 'noreferrer')
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

  return (
    <div className="profile">

      {/* Background */}
      <div className="profile__bg"></div>

      <div className="profile__container">

        {/* Avatar */}
        <div className="profile__avatar">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} />
          ) : (
            <span>{profile.username?.[0]?.toUpperCase()}</span>
          )}
        </div>

        {/* Info */}
        <div className="profile__info">
          <h1 className="profile__name">
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
                className={`profile__link ${index === 0 ? 'profile__link--featured' : ''}`}
                onClick={() => handleLinkClick(link.url)}
              >
                <span className="profile__link-title">{link.title}</span>
                <svg className="profile__link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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