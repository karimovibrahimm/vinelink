import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import './Settings.css'

function Settings() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [form, setForm] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)
    setForm(f => ({ ...f, email: user.email }))
    await getProfile(user.id)
    setLoading(false)
  }

  const getProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setProfile(data)
  }

  const handleUpdateEmail = async () => {
    setSaving(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ email: form.email })
    if (error) {
      setError(error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const handleUpdatePassword = async () => {
    setError('')
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (form.newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: form.newPassword })
    if (error) {
      setError(error.message)
    } else {
      setForm(f => ({ ...f, newPassword: '', confirmPassword: '' }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleDeleteAccount = async () => {
    // In production, this would call a Supabase edge function
    // For now, just sign out
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="dashboard__loading">
        <div className="dashboard__spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">

      {/* Sidebar */}
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
          <a href="/dashboard/appearance" className="dashboard__nav-item">
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
          <a href="/dashboard/settings" className="dashboard__nav-item dashboard__nav-item--active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Settings
          </a>
        </nav>
        <div className="dashboard__sidebar-bottom">
          <div className="dashboard__profile-pill">
            <div className="dashboard__profile-avatar">
              {profile?.username?.[0]?.toUpperCase() || 'U'}
            </div>
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

      {/* Main */}
      <main className="dashboard__main">

        <div className="dashboard__header">
          <div>
            <h1 className="dashboard__title">Settings</h1>
            <p className="dashboard__subtitle">Manage your account</p>
          </div>
        </div>

        {error && <div className="dashboard__error">{error}</div>}
        {saved && <div className="settings__success">✓ Changes saved successfully</div>}

        {/* Plan */}
        <div className="settings__section">
          <h2 className="settings__section-title">Current Plan</h2>
          <div className="settings__plan">
            <div className="settings__plan-info">
              <div className="settings__plan-name">Free Plan</div>
              <div className="settings__plan-desc">5 links, basic themes, Vinelink subdomain</div>
            </div>
            <a href="#upgrade" className="settings__upgrade-btn">
              ⚡ Upgrade to Pro — $4/mo
            </a>
          </div>
          <div className="settings__plan-features">
            <div className="settings__plan-feature">
              <span className="settings__feature-check">✓</span> Up to 5 links
            </div>
            <div className="settings__plan-feature">
              <span className="settings__feature-check">✓</span> Basic themes
            </div>
            <div className="settings__plan-feature settings__plan-feature--locked">
              <span className="settings__feature-lock">🔒</span> Custom domain
            </div>
            <div className="settings__plan-feature settings__plan-feature--locked">
              <span className="settings__feature-lock">🔒</span> Remove Vinelink branding
            </div>
            <div className="settings__plan-feature settings__plan-feature--locked">
              <span className="settings__feature-lock">🔒</span> Advanced analytics
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="settings__section">
          <h2 className="settings__section-title">Account</h2>
          <div className="settings__field">
            <label className="settings__label">Username</label>
            <div className="settings__static">
              <span>vinelink.com/</span>
              <strong>{profile?.username}</strong>
            </div>
            <span className="settings__hint">Username cannot be changed after signup</span>
          </div>
          <div className="settings__field">
            <label className="settings__label">Email address</label>
            <div className="settings__input-row">
              <input
                className="dashboard__input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <button
                className="settings__save-btn"
                onClick={handleUpdateEmail}
                disabled={saving}
              >
                Update
              </button>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="settings__section">
          <h2 className="settings__section-title">Change Password</h2>
          <div className="settings__fields">
            <div className="settings__field">
              <label className="settings__label">New Password</label>
              <input
                className="dashboard__input"
                type="password"
                placeholder="At least 6 characters"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              />
            </div>
            <div className="settings__field">
              <label className="settings__label">Confirm New Password</label>
              <input
                className="dashboard__input"
                type="password"
                placeholder="Repeat new password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
            </div>
            <button
              className="settings__save-btn"
              onClick={handleUpdatePassword}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Update password'}
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="settings__section settings__section--danger">
          <h2 className="settings__section-title settings__section-title--danger">Danger Zone</h2>
          <div className="settings__danger-row">
            <div>
              <div className="settings__danger-title">Delete account</div>
              <div className="settings__danger-desc">Permanently delete your account and all your links. This cannot be undone.</div>
            </div>
            {!deleteConfirm ? (
              <button
                className="settings__delete-btn"
                onClick={() => setDeleteConfirm(true)}
              >
                Delete account
              </button>
            ) : (
              <div className="settings__delete-confirm">
                <span>Are you sure?</span>
                <button className="settings__delete-btn" onClick={handleDeleteAccount}>Yes, delete</button>
                <button className="settings__cancel-confirm" onClick={() => setDeleteConfirm(false)}>Cancel</button>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Mobile Bottom Nav */}
      <nav className="dashboard__mobile-nav">
        <a href="/dashboard" className="dashboard__mobile-nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>Links</span>
        </a>
        <a href="/dashboard/appearance" className="dashboard__mobile-nav-item">
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
        <a href="/dashboard/settings" className="dashboard__mobile-nav-item dashboard__mobile-nav-item--active">
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

export default Settings