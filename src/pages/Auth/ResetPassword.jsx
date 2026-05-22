import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import usePageMeta from '../../lib/usePageMeta'
import './Auth.css'

export default function ResetPassword() {
  usePageMeta('Reset Password | Vinelink', 'Set a new password for your Vinelink account.')

  const [ready, setReady]     = useState(false)
  const [expired, setExpired] = useState(false)
  const [form, setForm]       = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)

  useEffect(() => {
    // PASSWORD_RECOVERY fires when Supabase processes the reset token from the URL
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    // Fallback: already have a session (e.g. page refresh after token was processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    // If nothing fires within 4 seconds the link is invalid or expired
    const timeout = setTimeout(() => {
      setExpired(true)
    }, 4000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  // Clear the timeout once ready so expired never shows after success
  useEffect(() => {
    if (ready) setExpired(false)
  }, [ready])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 6)       { setError('Password must be at least 6 characters.'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: form.password })
    if (error) { setError(error.message) }
    else       { setDone(true) }
    setLoading(false)
  }

  return (
    <div className="auth">

      <div className="auth__form-side">
        <div className="auth__form-wrapper">

          <a href="/" className="auth__logo">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <path d="M14 4 C14 4 8 8 8 14 C8 18 10 21 14 24 C18 21 20 18 20 14 C20 8 14 4 14 4Z" fill="#c9a84c"/>
              <path d="M14 24 C14 24 10 20 8 16 C10 17 13 17 14 24Z" fill="#1a3a2a"/>
              <path d="M14 24 C14 24 18 20 20 16 C18 17 15 17 14 24Z" fill="#1a3a2a"/>
              <line x1="14" y1="24" x2="14" y2="28" stroke="#1a3a2a" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Vinelink
          </a>

          {/* Success */}
          {done && (
            <div className="auth__success">
              <div className="auth__success-icon">🔒</div>
              <h2>Password updated</h2>
              <p>Your new password has been saved. You can now log in.</p>
              <a href="/dashboard" className="auth__btn">Go to dashboard</a>
            </div>
          )}

          {/* Expired / invalid link */}
          {!done && expired && !ready && (
            <div className="auth__success">
              <div className="auth__success-icon">⏱️</div>
              <h2>Link expired</h2>
              <p>This reset link has expired or already been used. Request a new one.</p>
              <a href="/forgot-password" className="auth__btn">Request new link</a>
            </div>
          )}

          {/* Loading — waiting for Supabase to process the token */}
          {!done && !expired && !ready && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="dashboard__spinner" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                Verifying reset link…
              </p>
            </div>
          )}

          {/* Password form */}
          {!done && ready && (
            <>
              <div className="auth__header">
                <h1 className="auth__title">Set new password</h1>
                <p className="auth__subtitle">Choose a strong password for your account.</p>
              </div>

              {error && <div className="auth__error">{error}</div>}

              <form className="auth__form" onSubmit={handleSubmit}>
                <div className="auth__field">
                  <label className="auth__label">New password</label>
                  <input
                    className="auth__input"
                    type="password"
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={e => { setForm({ ...form, password: e.target.value }); setError('') }}
                    required
                    autoFocus
                  />
                </div>
                <div className="auth__field">
                  <label className="auth__label">Confirm new password</label>
                  <input
                    className="auth__input"
                    type="password"
                    placeholder="Repeat new password"
                    value={form.confirm}
                    onChange={e => { setForm({ ...form, confirm: e.target.value }); setError('') }}
                    required
                  />
                </div>
                <button className="auth__btn" type="submit" disabled={loading}>
                  {loading ? 'Saving…' : 'Set new password'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>

      <div className="auth__visual-side">
        <div className="auth__visual-content">
          <div className="auth__visual-card">
            <div className="auth__mock-profile">
              <div className="auth__mock-avatar">Y</div>
              <div className="auth__mock-name">Your Name</div>
              <div className="auth__mock-bio">Your bio goes here ✨</div>
            </div>
            <div className="auth__mock-links">
              <div className="auth__mock-link auth__mock-link--featured">🔗 My latest post</div>
              <div className="auth__mock-link">🛍️ Shop my favorites</div>
              <div className="auth__mock-link">📩 Work with me</div>
            </div>
            <div className="auth__mock-url">vinelink.com/yourname</div>
          </div>
          <h2 className="auth__visual-title">Back in no time.</h2>
          <p className="auth__visual-subtitle">We've got you covered.</p>
        </div>
      </div>

    </div>
  )
}
