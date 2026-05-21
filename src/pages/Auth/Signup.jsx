import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import './Auth.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Signup() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameTaken, setUsernameTaken]       = useState(false)
  const [emailTaken, setEmailTaken]             = useState(false)

  const usernameFormatError = (() => {
    const u = form.username
    if (!u) return ''
    if (u.length < 3) return 'At least 3 characters'
    if (u.length > 32) return 'Max 32 characters'
    if (!/^[a-z0-9-]+$/.test(u)) return 'Only lowercase letters, numbers, and hyphens'
    if (/^-|-$/.test(u)) return 'Cannot start or end with a hyphen'
    if (/--/.test(u)) return 'No consecutive hyphens'
    return ''
  })()

  const usernameError = usernameFormatError || (usernameTaken ? 'This username is already taken' : '')
  const emailError    = emailTaken ? 'This email is already registered' : ''

  useEffect(() => {
    setUsernameTaken(false)
    if (!form.username || usernameFormatError) return
    setUsernameChecking(true)
    const t = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('id').eq('username', form.username).maybeSingle()
      setUsernameTaken(!!data)
      setUsernameChecking(false)
    }, 500)
    return () => clearTimeout(t)
  }, [form.username, usernameFormatError])

  useEffect(() => { setEmailTaken(false) }, [form.email])

  const handleChange = (e) => {
    const { name, value } = e.target
    const val = name === 'username' ? value.toLowerCase().replace(/[^a-z0-9-]/g, '') : value
    setForm({ ...form, [name]: val })
    setError('')
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (usernameError || emailError || usernameChecking) return
    setLoading(true)
    setError('')

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { username: form.username } }
    })

    if (error) {
      setError(error.message)
    } else if (data?.user?.identities?.length === 0) {
      setEmailTaken(true)
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  const usernameWrapperClass = [
    'auth__input-wrapper',
    form.username && usernameError      ? 'auth__input-wrapper--error' : '',
    form.username && !usernameError && !usernameChecking ? 'auth__input-wrapper--valid' : '',
  ].filter(Boolean).join(' ')

  const emailWrapperClass = ['auth__input', emailError ? 'auth__input--error' : ''].filter(Boolean).join(' ')
  const canSubmit = !loading && !usernameError && !emailError && !usernameChecking && form.username && form.email && form.password

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

          {success ? (
            <div className="auth__success">
              <div className="auth__success-icon">✉️</div>
              <h2>Check your email</h2>
              <p>We sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account.</p>
              <a href="/login" className="auth__btn">Go to Log In</a>
            </div>
          ) : (
            <>
              <div className="auth__header">
                <h1 className="auth__title">Create your account</h1>
                <p className="auth__subtitle">Free forever. No credit card needed.</p>
              </div>

              <button className="auth__google-btn" onClick={handleGoogle} disabled={googleLoading || loading}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {googleLoading ? 'Redirecting…' : 'Continue with Google'}
              </button>

              <div className="auth__divider"><span>or</span></div>

              {error && <div className="auth__error">{error}</div>}

              <form className="auth__form" onSubmit={handleSubmit}>

                <div className="auth__field">
                  <label className="auth__label">Username</label>
                  <div className={usernameWrapperClass}>
                    <input
                      className="auth__input auth__input--subdomain"
                      type="text"
                      name="username"
                      placeholder="yourname"
                      value={form.username}
                      onChange={handleChange}
                      required
                    />
                    <span className="auth__input-suffix">.vinelink.xyz</span>
                  </div>
                  {form.username && usernameChecking && (
                    <span className="auth__field-checking">Checking availability…</span>
                  )}
                  {form.username && !usernameChecking && usernameError && (
                    <span className="auth__field-error">{usernameError}</span>
                  )}
                  {form.username && !usernameChecking && !usernameError && (
                    <span className="auth__field-valid">✓ {form.username}.vinelink.xyz is available</span>
                  )}
                </div>

                <div className="auth__field">
                  <label className="auth__label">Email address</label>
                  <input
                    className={emailWrapperClass}
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                  {emailError && <span className="auth__field-error">{emailError}</span>}
                </div>

                <div className="auth__field">
                  <label className="auth__label">Password</label>
                  <input
                    className="auth__input"
                    type="password"
                    name="password"
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button className="auth__btn" type="submit" disabled={!canSubmit}>
                  {loading ? 'Creating account…' : usernameChecking ? 'Checking…' : 'Create free account'}
                </button>
              </form>

              <p className="auth__switch">
                Already have an account? <a href="/login">Log in</a>
              </p>

              <p className="auth__terms">
                By signing up you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
              </p>
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
            <div className="auth__mock-url">yourname.vinelink.xyz</div>
          </div>
          <h2 className="auth__visual-title">Your page.<br />Your way.</h2>
          <p className="auth__visual-subtitle">Beautiful, fast, and yours in 2 minutes.</p>
        </div>
      </div>

    </div>
  )
}

export default Signup
