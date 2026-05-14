import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getThemeById } from '../../lib/themes'
import './Onboarding.css'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

const LOADING_STEPS = [
  'Analyzing your content...',
  'Crafting your bio...',
  'Selecting the perfect theme...',
  'Building your links...',
]

function Onboarding({ user, profile, onComplete }) {
  const [step, setStep] = useState(1)
  const [socialInput, setSocialInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading) return
    setLoadingStep(0)
    const timers = LOADING_STEPS.map((_, i) =>
      setTimeout(() => setLoadingStep(i), i * 950)
    )
    return () => timers.forEach(clearTimeout)
  }, [loading])

  const handleSkip = async () => {
    await supabase.from('profiles').update({ onboarding_done: true }).eq('id', user.id)
    onComplete()
  }

  const handleGenerate = async () => {
    if (!socialInput.trim()) return
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are helping set up a link-in-bio page. Based on this info: "${socialInput}", generate a profile.

Respond ONLY with valid JSON, no markdown or explanation:
{
  "full_name": "their name or handle cleaned up",
  "bio": "punchy 1-2 sentence bio under 120 chars that fits their niche",
  "theme": "pick the best fit from: forest, ocean, rose, midnight, sand, slate, neon, aurora, paper, glass, candy, earth, sunset, lavender",
  "links": [
    { "title": "short descriptive label", "url": "full url including https://" }
  ]
}`
              }]
            }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
          })
        }
      )

      const data = await response.json()
      const text = data.candidates[0].content.parts[0].text
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setResult(parsed)
      setStep(2)
    } catch (e) {
      setError('Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  const handleApply = async () => {
    setLoading(true)

    await supabase.from('profiles').update({
      full_name: result.full_name,
      bio: result.bio,
      theme: result.theme,
      onboarding_done: true
    }).eq('id', user.id)

    if (result.links?.length > 0) {
      await supabase.from('links').insert(
        result.links.map((link, i) => ({
          user_id: user.id,
          title: link.title,
          url: link.url.startsWith('http') ? link.url : 'https://' + link.url,
          position: i,
          active: true
        }))
      )
    }

    setLoading(false)
    onComplete()
  }

  const activeTheme = getThemeById(result?.theme)

  const getPreviewBg = () => {
    const t = activeTheme
    if (t.id === 'aurora')   return 'linear-gradient(160deg, #0a1628 0%, #0d2040 100%)'
    if (t.id === 'glass')    return 'linear-gradient(135deg, #16213e 0%, #0f3460 100%)'
    if (t.id === 'neon')     return '#0a0a0a'
    if (t.id === 'midnight') return 'radial-gradient(ellipse at 50% 0%, rgba(122,106,202,0.3) 0%, transparent 60%), #0d0d1a'
    return `linear-gradient(160deg, ${t.bgGradient} 0%, ${t.bg} 60%)`
  }

  const getLinkStyle = (i) => {
    const t = activeTheme
    if (t.id === 'neon')
      return { background: i === 0 ? 'rgba(0,255,136,0.15)' : 'transparent', border: `1px solid ${i === 0 ? '#00ff88' : 'rgba(0,255,136,0.2)'}`, color: '#00ff88' }
    if (t.id === 'aurora' || t.id === 'glass')
      return { background: i === 0 ? 'rgba(100,255,218,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${i === 0 ? 'rgba(100,255,218,0.4)' : 'rgba(255,255,255,0.1)'}`, color: i === 0 ? t.accent : '#fff' }
    if (t.id === 'midnight')
      return { background: i === 0 ? 'rgba(122,106,202,0.3)' : 'rgba(255,255,255,0.05)', border: `1px solid ${i === 0 ? 'rgba(122,106,202,0.6)' : 'rgba(255,255,255,0.1)'}`, color: '#fff' }
    if (t.id === 'paper')
      return { background: i === 0 ? '#c0392b' : '#fffef9', border: `1px solid ${i === 0 ? '#c0392b' : '#d4c9b0'}`, color: i === 0 ? '#fff' : '#2c2c2c', borderRadius: '4px' }
    if (t.id === 'candy')
      return { background: i === 0 ? 'linear-gradient(135deg, #d63384, #fd7e14)' : '#fff', border: `1px solid ${i === 0 ? 'transparent' : '#f8b4d9'}`, color: i === 0 ? '#fff' : '#d63384', borderRadius: '100px' }
    const tc = t.textColor || t.primary
    return { backgroundColor: i === 0 ? t.primary : (t.cardBg || '#fff'), borderColor: i === 0 ? t.primary : (t.borderColor || `${t.primary}22`), color: i === 0 ? '#fff' : tc }
  }

  return (
    <div className="onboarding">
      <div className="onboarding__container">

        <a href="/" className="onboarding__logo">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <path d="M14 4 C14 4 8 8 8 14 C8 18 10 21 14 24 C18 21 20 18 20 14 C20 8 14 4 14 4Z" fill="#c9a84c"/>
            <path d="M14 24 C14 24 10 20 8 16 C10 17 13 17 14 24Z" fill="#1a3a2a"/>
            <path d="M14 24 C14 24 18 20 20 16 C18 17 15 17 14 24Z" fill="#1a3a2a"/>
            <line x1="14" y1="24" x2="14" y2="28" stroke="#1a3a2a" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Vinelink
        </a>

        <div className="onboarding__steps">
          <div className={`onboarding__step-dot ${step >= 1 ? 'onboarding__step-dot--active' : ''}`} />
          <div className="onboarding__step-line" />
          <div className={`onboarding__step-dot ${step >= 2 ? 'onboarding__step-dot--active' : ''}`} />
        </div>

        {step === 1 && (
          <div className="onboarding__step">
            <div className="onboarding__badge">✨ AI Setup</div>
            <h1 className="onboarding__title">Let AI build your page</h1>
            <p className="onboarding__subtitle">
              Paste your social links and a short description. Our AI will build your entire Vinelink page in seconds.
            </p>

            <textarea
              className="onboarding__textarea"
              placeholder={`Paste your links and a short description, for example:\n\nInstagram: instagram.com/johndoe\nYouTube: youtube.com/johndoe\nI'm a travel photographer based in NYC`}
              value={socialInput}
              onChange={(e) => setSocialInput(e.target.value)}
              rows={6}
            />

            {error && <div className="onboarding__error">{error}</div>}

            {loading ? (
              <div className="onboarding__loading-steps">
                {LOADING_STEPS.map((s, i) => (
                  <div key={i} className={`onboarding__loading-step ${i < loadingStep ? 'onboarding__loading-step--done' : ''} ${i === loadingStep ? 'onboarding__loading-step--active' : ''}`}>
                    <div className="onboarding__loading-icon">
                      {i < loadingStep ? '✓' : i === loadingStep ? <span className="onboarding__spinner" /> : '·'}
                    </div>
                    {s}
                  </div>
                ))}
              </div>
            ) : (
              <button className="onboarding__btn" onClick={handleGenerate} disabled={!socialInput.trim()}>
                ✨ Build my Vinelink page
              </button>
            )}

            <button className="onboarding__skip" onClick={handleSkip}>
              Skip and set up manually →
            </button>
          </div>
        )}

        {step === 2 && result && (
          <div className="onboarding__step">
            <div className="onboarding__badge">🎉 Your page is ready</div>
            <h1 className="onboarding__title">Looking good!</h1>
            <p className="onboarding__subtitle">Here's what AI created for you. You can edit everything after.</p>

            <div className="onboarding__preview" style={{ background: getPreviewBg() }}>
              <div
                className="onboarding__preview-avatar"
                style={{ background: `linear-gradient(135deg, ${activeTheme.primary}, ${activeTheme.accent})` }}
              >
                {result.full_name?.[0]?.toUpperCase()}
              </div>
              <div className="onboarding__preview-name" style={{ color: activeTheme.textColor || activeTheme.primary }}>
                {result.full_name}
              </div>
              <div className="onboarding__preview-bio" style={{ color: activeTheme.subtextColor || (activeTheme.style === 'dark' ? 'rgba(255,255,255,0.6)' : '#666') }}>
                {result.bio}
              </div>
              <div className="onboarding__preview-links">
                {result.links?.map((link, i) => (
                  <div key={i} className="onboarding__preview-link" style={getLinkStyle(i)}>
                    {link.title}
                  </div>
                ))}
              </div>
              <div className="onboarding__preview-theme" style={{ color: activeTheme.subtextColor || (activeTheme.style === 'dark' ? 'rgba(255,255,255,0.4)' : '#999') }}>
                Theme: <strong>{activeTheme.name}</strong>
              </div>
            </div>

            <div className="onboarding__actions">
              <button className="onboarding__btn" onClick={handleApply} disabled={loading}>
                {loading ? 'Applying...' : '🚀 Apply and go to dashboard'}
              </button>
              <button className="onboarding__skip" onClick={() => { setStep(1); setResult(null) }}>
                ← Try again
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default Onboarding
