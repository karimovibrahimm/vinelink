import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { themes } from '../../lib/themes'
import './Appearance.css'

function Appearance() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [form, setForm] = useState({ full_name: '', bio: '', theme: 'forest' })
  const fileInputRef = useRef(null)

  useEffect(() => { getUser() }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)
    await getProfile(user.id)
    await getLinks(user.id)
    setLoading(false)
  }

  const getProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) {
      setProfile(data)
      setAvatarUrl(data.avatar_url || null)
      setForm({
        full_name: data.full_name || '',
        bio: data.bio || '',
        theme: data.theme || 'forest'
      })
    }
  }

  const getLinks = async (userId) => {
    const { data } = await supabase.from('links').select('*').eq('user_id', userId).eq('active', true).order('position', { ascending: true })
    if (data) setLinks(data)
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB'); return }
    const reader = new FileReader()
    reader.onload = (e) => setAvatarPreview(e.target.result)
    reader.readAsDataURL(file)
    setUploadingAvatar(true)
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/avatar.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
    if (uploadError) { alert('Upload failed: ' + uploadError.message); setUploadingAvatar(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
    const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
    if (!updateError) setAvatarUrl(publicUrl)
    setUploadingAvatar(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      bio: form.bio,
      theme: form.theme
    }).eq('id', user.id)
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const activeTheme = themes.find(t => t.id === form.theme) || themes[0]
  const displayAvatar = avatarPreview || avatarUrl

  if (loading) return (
    <div className="dashboard__loading">
      <div className="dashboard__spinner"></div>
      <p>Loading...</p>
    </div>
  )

  return (
    <div className="dashboard">

      <aside className="dashboard__sidebar">
        <a href="/" className="dashboard__logo">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <path d="M14 4 C14 4 8 8 8 14 C8 18 10 21 14 24 C18 21 20 18 20 14 C20 8 14 4 14 4Z" fill="#c9a84c"/>
            <path d="M14 24 C14 24 10 20 8 16 C10 17 13 17 14 24Z" fill="#1a3a2a"/>
            <path d="M14 24 C14 24 18 20 20 16 C18 17 15 17 14 24Z" fill="#1a3a2a"/>
            <line x1="14" y1="24" x2="14" y2="28" stroke="#1a3a2a" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Vinelink
        </a>
        <nav className="dashboard__nav">
          <a href="/dashboard" className="dashboard__nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Links
          </a>
          <a href="/dashboard/appearance" className="dashboard__nav-item dashboard__nav-item--active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            Appearance
          </a>
          <a href="/dashboard/analytics" className="dashboard__nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Analytics
          </a>
          <a href="/dashboard/settings" className="dashboard__nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Settings
          </a>
        </nav>
        <div className="dashboard__sidebar-bottom">
          <div className="dashboard__profile-pill">
            <div className="dashboard__profile-avatar">{profile?.username?.[0]?.toUpperCase() || 'U'}</div>
            <div className="dashboard__profile-info">
              <div className="dashboard__profile-name">@{profile?.username}</div>
              <div className="dashboard__profile-plan">Free plan</div>
            </div>
          </div>
          <button className="dashboard__logout" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log out
          </button>
        </div>
      </aside>

      <main className="dashboard__main">
        <div className="dashboard__header">
          <div>
            <h1 className="dashboard__title">Appearance</h1>
            <p className="dashboard__subtitle">Customize how your Vinelink page looks</p>
          </div>
          <button className="dashboard__add-btn" onClick={handleSave} disabled={saving}>
            {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>

        <div className="appearance__section">
          <h2 className="appearance__section-title">Profile Photo</h2>
          <div className="appearance__avatar-row">
            <div className="appearance__avatar-preview">
              {displayAvatar ? <img src={displayAvatar} alt="avatar" /> : <span>{profile?.username?.[0]?.toUpperCase()}</span>}
              {uploadingAvatar && <div className="appearance__avatar-overlay"><div className="dashboard__spinner"></div></div>}
            </div>
            <div className="appearance__avatar-actions">
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarChange} style={{ display: 'none' }}/>
              <button className="appearance__upload-btn" onClick={() => fileInputRef.current.click()} disabled={uploadingAvatar}>
                {uploadingAvatar ? 'Uploading...' : 'Upload photo'}
              </button>
              <p className="appearance__hint">JPG, PNG or GIF. Max 2MB.</p>
            </div>
          </div>
        </div>

        <div className="appearance__section">
          <h2 className="appearance__section-title">Profile Info</h2>
          <div className="appearance__fields">
            <div className="appearance__field">
              <label className="appearance__label">Display Name</label>
              <input className="dashboard__input" type="text" placeholder="Your full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}/>
              <span className="appearance__hint">This appears at the top of your page</span>
            </div>
            <div className="appearance__field">
              <label className="appearance__label">Bio</label>
              <textarea className="dashboard__input appearance__textarea" placeholder="Tell your audience who you are..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={160}/>
              <span className="appearance__hint">{form.bio.length}/160 characters</span>
            </div>
          </div>
        </div>

        <div className="appearance__section">
          <h2 className="appearance__section-title">Theme</h2>
          <p className="appearance__section-subtitle">Choose a color theme for your page</p>
          <div className="appearance__themes">
            {themes.map((theme) => (
              <button
                key={theme.id}
                className={`appearance__theme ${form.theme === theme.id ? 'appearance__theme--active' : ''}`}
                onClick={() => setForm({ ...form, theme: theme.id })}
              >
                <div
                  className="appearance__theme-preview"
                  style={{
                    background: theme.id === 'aurora' ? 'linear-gradient(135deg, #0a1628, #64ffda)'
                      : theme.id === 'neon' ? 'linear-gradient(135deg, #0a0a0a, #00ff88)'
                      : theme.id === 'glass' ? 'linear-gradient(135deg, #16213e, #e94560)'
                      : theme.id === 'midnight' ? 'linear-gradient(135deg, #0d0d1a, #7a6aca)'
                      : theme.id === 'candy' ? 'linear-gradient(135deg, #d63384, #fd7e14)'
                      : theme.id === 'paper' ? 'linear-gradient(135deg, #f5f0e8, #c0392b)'
                      : theme.id === 'earth' ? 'linear-gradient(135deg, #3d2b1f, #8b6914)'
                      : `linear-gradient(135deg, ${theme.primary} 50%, ${theme.accent} 100%)`
                  }}
                >
                  <div className="appearance__theme-dot" style={{ background: theme.bg }}></div>
                </div>
                <span className="appearance__theme-name">{theme.name}</span>
                {form.theme === theme.id && <div className="appearance__theme-check">✓</div>}
              </button>
            ))}
          </div>
        </div>

        <button className="appearance__save-btn" onClick={handleSave} disabled={saving}>
          {saved ? '✓ Changes saved!' : saving ? 'Saving...' : 'Save changes'}
        </button>
      </main>

      <aside className="dashboard__preview">
        <div className="dashboard__preview-header">
          <span>Live Preview</span>
          <div className="dashboard__preview-dot"></div>
        </div>
        <div className="dashboard__phone" style={{ borderColor: activeTheme.primary }}>
          <div className="dashboard__phone-notch" style={{ background: activeTheme.primary }}></div>
          <div className="dashboard__phone-screen" style={{ background: `linear-gradient(180deg, ${activeTheme.bg} 0%, #ffffff 100%)` }}>
            <div className="dashboard__mock-profile">
              <div className="dashboard__mock-avatar" style={{
                background: displayAvatar ? 'none' : `linear-gradient(135deg, ${activeTheme.primary}, ${activeTheme.accent})`,
                overflow: 'hidden', padding: 0
              }}>
                {displayAvatar
                  ? <img src={displayAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  : profile?.username?.[0]?.toUpperCase()
                }
              </div>
              <div className="dashboard__mock-name">{form.full_name || `@${profile?.username}`}</div>
              <div className="dashboard__mock-bio">{form.bio || 'Your bio appears here'}</div>
            </div>
            <div className="dashboard__mock-links">
              {links.length === 0
                ? <div className="dashboard__mock-empty">Add links to see preview</div>
                : links.slice(0, 4).map((link, i) => (
                  <div key={link.id} className="dashboard__mock-link" style={i === 0 ? {
                    background: activeTheme.primary, color: '#fff', borderColor: activeTheme.primary
                  } : {}}>
                    {link.title}
                  </div>
                ))
              }
            </div>
            <div className="dashboard__mock-footer">vinelink.com/{profile?.username}</div>
          </div>
        </div>
      </aside>

      <nav className="dashboard__mobile-nav">
        <a href="/dashboard" className="dashboard__mobile-nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>Links</span>
        </a>
        <a href="/dashboard/appearance" className="dashboard__mobile-nav-item dashboard__mobile-nav-item--active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span>Appearance</span>
        </a>
        <a href="/dashboard/analytics" className="dashboard__mobile-nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <span>Analytics</span>
        </a>
        <a href="/dashboard/settings" className="dashboard__mobile-nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span>Settings</span>
        </a>
      </nav>

    </div>
  )
}

export default Appearance