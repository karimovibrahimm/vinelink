import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import './Auth.css'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
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

          {sent ? (
            <div className="auth__success">
              <div className="auth__success-icon">📬</div>
              <h2>Reset link sent</h2>
              <p>Check your inbox at <strong>{email}</strong> and follow the link to reset your password.</p>
              <a href="/login" className="auth__btn">Back to Log In</a>
            </div>
          ) : (
            <>
              <div className="auth__header">
                <h1 className="auth__title">Forgot password?</h1>
                <p className="auth__subtitle">No worries. We'll send you a reset link.</p>
              </div>

              {error && <div className="auth__error">{error}</div>}

              <form className="auth__form" onSubmit={handleSubmit}>
                <div className="auth__field">
                  <label className="auth__label">Email address</label>
                  <input
                    className="auth__input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button className="auth__btn" type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

              <p className="auth__switch">
                Remember your password? <a href="/login">Log in</a>
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
          <h2 className="auth__visual-title">Back in no time.</h2>
          <p className="auth__visual-subtitle">We've got you covered.</p>
        </div>
      </div>

    </div>
  )
}

export default ForgotPassword