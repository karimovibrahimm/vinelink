import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { themes } from '../../lib/themes'
import { getThemeById } from '../../lib/themes'
import './Appearance.css'
import PhonePreview from '../../components/PhonePreview/PhonePreview'
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout'

function ThemeMiniPreview({ theme: t }) {
  const getBg = () => {
    if (t.id === 'aurora')   return 'radial-gradient(ellipse at 20% 50%, rgba(100,255,218,0.15) 0%, transparent 50%), linear-gradient(160deg, #0a1628 0%, #0d2040 100%)'
    if (t.id === 'glass')    return 'linear-gradient(135deg, #16213e 0%, #0f3460 50%, #1a1a2e 100%)'
    if (t.id === 'neon')     return '#0a0a0a'
    if (t.id === 'midnight') return 'radial-gradient(ellipse at 50% 0%, rgba(122,106,202,0.4) 0%, transparent 70%), #0d0d1a'
    return `linear-gradient(160deg, ${t.bgGradient} 0%, ${t.bg} 60%)`
  }
  const getLinkStyle = (i) => {
    if (t.id === 'neon')
      return { background: i === 0 ? 'rgba(0,255,136,0.2)' : 'transparent', border: `1px solid ${i === 0 ? '#00ff88' : 'rgba(0,255,136,0.2)'}`, color: '#00ff88' }
    if (t.id === 'aurora' || t.id === 'glass')
      return { background: i === 0 ? 'rgba(100,255,218,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${i === 0 ? 'rgba(100,255,218,0.5)' : 'rgba(255,255,255,0.1)'}`, color: i === 0 ? t.accent : '#fff' }
    if (t.id === 'midnight')
      return { background: i === 0 ? 'rgba(122,106,202,0.4)' : 'rgba(255,255,255,0.05)', border: `1px solid ${i === 0 ? 'rgba(122,106,202,0.7)' : 'rgba(255,255,255,0.1)'}`, color: i === 0 ? '#fff' : 'rgba(255,255,255,0.7)' }
    if (t.id === 'paper')
      return { background: i === 0 ? '#c0392b' : '#fffef9', border: `1px solid ${i === 0 ? '#c0392b' : '#d4c9b0'}`, color: i === 0 ? '#fff' : '#2c2c2c', borderRadius: '3px' }
    if (t.id === 'candy')
      return { background: i === 0 ? 'linear-gradient(135deg, #d63384, #fd7e14)' : '#fff', border: `1px solid ${i === 0 ? 'transparent' : '#f8b4d9'}`, color: i === 0 ? '#fff' : '#d63384', borderRadius: '100px' }
    const tc = t.textColor || t.primary
    return { backgroundColor: i === 0 ? t.primary : (t.cardBg || '#fff'), borderColor: i === 0 ? t.primary : (t.borderColor || `${t.primary}22`), color: i === 0 ? '#fff' : tc }
  }
  const nameColor = t.textColor || t.primary
  const fontFamily = t.font === 'mono' ? "'Courier New', monospace" : t.font === 'serif' ? 'Georgia, serif' : t.font === 'rounded' ? "'Trebuchet MS', sans-serif" : 'inherit'
  return (
    <div className="appearance__mini" style={{ background: getBg(), fontFamily }}>
      {t.pattern === 'grid'    && <div className="appearance__mini-overlay appearance__mini-overlay--grid" />}
      {t.pattern === 'dots'    && <div className="appearance__mini-overlay appearance__mini-overlay--dots" />}
      {t.pattern === 'stars'   && <div className="appearance__mini-overlay appearance__mini-overlay--stars" />}
      {t.pattern === 'noise'   && <div className="appearance__mini-overlay appearance__mini-overlay--noise" />}
      {t.pattern === 'texture' && <div className="appearance__mini-overlay appearance__mini-overlay--texture" />}
      {t.pattern === 'aurora'  && <div className="appearance__mini-overlay appearance__mini-overlay--aurora" style={{ '--accent': t.accent }} />}
      {t.pattern === 'glass'   && <div className="appearance__mini-overlay appearance__mini-overlay--glass" />}
      <div className="appearance__mini-content">
        <div className="appearance__mini-avatar" style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.accent})` }} />
        <div className="appearance__mini-name" style={{ background: nameColor, opacity: 0.45 }} />
        <div className="appearance__mini-link" style={getLinkStyle(0)} />
        <div className="appearance__mini-link" style={getLinkStyle(1)} />
      </div>
    </div>
  )
}

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
      setForm({ full_name: data.full_name || '', bio: data.bio || '', theme: data.theme || 'forest' })
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
      full_name: form.full_name, bio: form.bio, theme: form.theme
    }).eq('id', user.id)
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    setSaving(false)
  }

  const activeTheme = themes.find(t => t.id === form.theme) || themes[0]
  const displayAvatar = avatarPreview || avatarUrl

  if (loading) return (
    <DashboardLayout activePage="appearance" profile={null}>
      <main className="dashboard__main">
        <div className="dashboard__header">
          <div className="sk" style={{ height: 26, width: 160 }}/>
        </div>
        <div style={{ display: 'flex', gap: 16, margin: '32px 0 24px', alignItems: 'center' }}>
          <div className="sk" style={{ width: 80, height: 80, borderRadius: '50%' }}/>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="sk" style={{ height: 14, width: '50%' }}/>
            <div className="sk" style={{ height: 14, width: '35%' }}/>
          </div>
        </div>
        <div className="sk" style={{ height: 44, marginBottom: 12 }}/>
        <div className="sk" style={{ height: 88, marginBottom: 32 }}/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="sk" style={{ height: 96, borderRadius: 12 }}/>
          ))}
        </div>
      </main>
    </DashboardLayout>
  )

  return (
    <DashboardLayout activePage="appearance" profile={profile}>

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
                <ThemeMiniPreview theme={theme} />
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

      <PhonePreview
        profile={{ ...profile, full_name: form.full_name, bio: form.bio, avatar_url: avatarPreview || avatarUrl }}
        links={links}
        themeObj={activeTheme}
      />

    </DashboardLayout>
  )
}

export default Appearance
