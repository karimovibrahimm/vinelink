import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import './Auth.css'

function Signup() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { username: form.username }
      }
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  return (
    <div className="auth">

      {/* Left - Form */}
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

              {error && <div className="auth__error">{error}</div>}

              <form className="auth__form" onSubmit={handleSubmit}>
                <div className="auth__field">
                  <label className="auth__label">Username</label>
                  <div className="auth__input-wrapper">
                    <span className="auth__input-prefix">vinelink.com/</span>
                    <input
                      className="auth__input auth__input--prefixed"
                      type="text"
                      name="username"
                      placeholder="yourname"
                      value={form.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="auth__field">
                  <label className="auth__label">Email address</label>
                  <input
                    className="auth__input"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
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

                <button className="auth__btn" type="submit" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create free account'}
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

      {/* Right - Visual */}
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
          <h2 className="auth__visual-title">Your page.<br />Your way.</h2>
          <p className="auth__visual-subtitle">Beautiful, fast, and yours in 2 minutes.</p>
        </div>
      </div>

    </div>
  )
}

export default Signup