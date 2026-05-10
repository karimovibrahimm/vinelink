import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import './Auth.css'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setError(error.message)
    } else {
      window.location.href = '/dashboard'
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

          <div className="auth__header">
            <h1 className="auth__title">Welcome back</h1>
            <p className="auth__subtitle">Log in to manage your Vinelink page.</p>
          </div>

          {error && <div className="auth__error">{error}</div>}

          <form className="auth__form" onSubmit={handleSubmit}>
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
              <div className="auth__label-row">
                <label className="auth__label">Password</label>
                <a href="/forgot-password" className="auth__forgot">Forgot password?</a>
              </div>
              <input
                className="auth__input"
                type="password"
                name="password"
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <button className="auth__btn" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <p className="auth__switch">
            Don't have an account? <a href="/signup">Sign up free</a>
          </p>

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
          <h2 className="auth__visual-title">Good to have<br />you back.</h2>
          <p className="auth__visual-subtitle">Your audience is waiting.</p>
        </div>
      </div>

    </div>
  )
}

export default Login