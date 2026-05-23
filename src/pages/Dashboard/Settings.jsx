import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout'
import usePageMeta from '../../lib/usePageMeta'
import { useToast } from '../../lib/ToastContext'
import './Settings.css'

function Settings() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  usePageMeta('Settings | Vinelink', 'Manage your Vinelink account settings, email, and password.')

  const toast = useToast()
  const [upgrading, setUpgrading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [emailPending, setEmailPending] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [form, setForm] = useState({ email: '', newPassword: '', confirmPassword: '' })

  useEffect(() => { getUser() }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)
    setForm(f => ({ ...f, email: user.email }))
    await getProfile(user.id)
    setLoading(false)
  }

  const getProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) setProfile(data)
  }

  const handleUpdateEmail = async () => {
    setSaving(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ email: form.email })
    if (error) { setError(error.message); toast.error('Failed to update email.') }
    else { setEmailPending(true); toast.info('Confirmation email sent.') }
    setSaving(false)
  }

  const handleUpdatePassword = async () => {
    setError('')
    if (form.newPassword !== form.confirmPassword) { setError('Passwords do not match.'); return }
    if (form.newPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: form.newPassword })
    if (error) { setError(error.message); toast.error('Failed to update password.') } else {
      setForm(f => ({ ...f, newPassword: '', confirmPassword: '' }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      toast.success('Password updated!')
    }
    setSaving(false)
  }

  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      const res = await fetch('/api/polar-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        toast.error(json.error || 'Could not open checkout.')
        setUpgrading(false)
      }
    } catch (err) {
      toast.error(`Could not open checkout: ${err.message}`)
      setUpgrading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleDeleteAccount = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }


  if (loading) return (
    <DashboardLayout activePage="settings" profile={null}>
      <main className="dashboard__main">
        <div className="dashboard__header">
          <div className="sk" style={{ height: 26, width: 110 }}/>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ marginTop: 36 }}>
            <div className="sk" style={{ height: 16, width: 130, marginBottom: 18 }}/>
            <div className="sk" style={{ height: 44, marginBottom: 12 }}/>
            <div className="sk" style={{ height: 44 }}/>
          </div>
        ))}
      </main>
    </DashboardLayout>
  )

  return (
    <DashboardLayout activePage="settings" profile={profile}>

      <main className="dashboard__main">
        <div className="dashboard__header">
          <div>
            <h1 className="dashboard__title">Settings</h1>
            <p className="dashboard__subtitle">Manage your account</p>
          </div>
        </div>

        {error && <div className="dashboard__error">{error}</div>}
        {saved && <div className="settings__success">✓ Changes saved successfully</div>}

        {/* Account */}
        <div className="settings__section">
          <h2 className="settings__section-title">Account</h2>
          <div className="settings__field">
            <label className="settings__label">Username</label>
            <div className="settings__static">
              <strong>{profile?.username}</strong>
              <span>.vinelink.xyz</span>
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
                onChange={(e) => { setForm({ ...form, email: e.target.value }); setEmailPending(false) }}
              />
              <button className="settings__save-btn" onClick={handleUpdateEmail} disabled={saving}>
                Update
              </button>
            </div>
            {emailPending && (
              <span className="settings__hint" style={{ color: '#2563eb' }}>
                ✉️ Confirmation sent to <strong>{form.email}</strong> — click the link to confirm.
              </span>
            )}
          </div>
        </div>

        {/* Plan */}
        <div className="settings__section">
          <h2 className="settings__section-title">Plan</h2>
          {profile?.plan === 'pro' ? (
            <div className="settings__plan-pro">
              <div>
                <div className="settings__plan-badge">⚡ Pro</div>
                <div className="settings__plan-desc" style={{ marginTop: 6 }}>
                  You're on the Pro plan. Thank you for supporting Vinelink!
                </div>
              </div>
              <a
                href="https://polar.sh/purchases/subscriptions"
                target="_blank"
                rel="noreferrer"
                className="settings__manage-btn"
              >
                Manage subscription ↗
              </a>
            </div>
          ) : (
            <div className="settings__plan-free">
              <div className="settings__plan-info">
                <div className="settings__plan-badge settings__plan-badge--free">Free</div>
                <div className="settings__plan-desc">Upgrade to Pro to unlock unlimited links, advanced analytics, and more.</div>
              </div>
              <button
                className="settings__upgrade-btn"
                onClick={handleUpgrade}
                disabled={upgrading}
              >
                {upgrading ? 'Loading…' : '⚡ Upgrade to Pro'}
              </button>
            </div>
          )}
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
            <button className="settings__save-btn" onClick={handleUpdatePassword} disabled={saving}>
              {saving ? 'Saving...' : 'Update password'}
            </button>
          </div>
        </div>

        {/* Session */}
        <div className="settings__section">
          <h2 className="settings__section-title">Session</h2>
          <div className="settings__danger-row">
            <div>
              <div className="settings__danger-title">Log out</div>
              <div className="settings__danger-desc">Sign out of your Vinelink account on this device.</div>
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
              <button className="settings__delete-btn" onClick={() => setDeleteConfirm(true)}>
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

    </DashboardLayout>
  )
}

export default Settings
