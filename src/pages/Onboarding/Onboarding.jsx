import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { getThemeById } from '../../lib/themes'
import './Onboarding.css'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

const LOADING_STEPS = [
  'Reading your content...',
  'Generating 3 unique profiles...',
  'Crafting bios and themes...',
  'Finalizing your links...',
]

function VariantCard({ variant, avatarPreview, selected, onSelect }) {
  const theme = getThemeById(variant.theme)

  const getCardBg = () => {
    const t = theme
    if (t.id === 'aurora' || t.id === 'glass') return 'linear-gradient(160deg, #0a1628, #0d2040)'
    if (t.id === 'neon')     return '#0a0a0a'
    if (t.id === 'midnight') return 'radial-gradient(ellipse at 50% 0%, rgba(122,106,202,0.3) 0%, transparent 60%), #0d0d1a'
    return `linear-gradient(160deg, ${t.bgGradient || t.bg} 0%, ${t.bg} 100%)`
  }

  const getLinkStyle = (i) => {
    const t = theme
    if (t.id === 'neon')
      return { background: 'rgba(0,255,136,0.15)', border: '1px solid #00ff88', color: '#00ff88' }
    if (t.id === 'aurora' || t.id === 'glass')
      return { background: 'rgba(100,255,218,0.15)', border: '1px solid rgba(100,255,218,0.4)', color: t.accent }
    if (t.id === 'midnight')
      return { background: 'rgba(122,106,202,0.3)', border: '1px solid rgba(122,106,202,0.6)', color: '#fff' }
    if (t.id === 'paper')
      return { background: i === 0 ? '#c0392b' : '#fffef9', border: `1px solid ${i === 0 ? '#c0392b' : '#d4c9b0'}`, color: i === 0 ? '#fff' : '#2c2c2c', borderRadius: '4px' }
    if (t.id === 'candy')
      return { background: i === 0 ? 'linear-gradient(135deg, #d63384, #fd7e14)' : '#fff', border: `1px solid ${i === 0 ? 'transparent' : '#f8b4d9'}`, color: i === 0 ? '#fff' : '#d63384', borderRadius: '100px' }
    const tc = t.textColor || t.primary
    return { backgroundColor: i === 0 ? t.primary : (t.cardBg || '#fff'), borderColor: i === 0 ? t.primary : (t.borderColor || `${t.primary}22`), color: i === 0 ? '#fff' : tc }
  }

  const nameColor = theme.textColor || theme.primary
  const bioColor  = theme.subtextColor || (theme.style === 'dark' ? 'rgba(255,255,255,0.6)' : '#777')

  return (
    <button
      className={`onboarding__variant${selected ? ' onboarding__variant--selected' : ''}`}
      onClick={onSelect}
    >
      <div className="onboarding__variant-label">{variant.label}</div>

      <div className="onboarding__variant-preview" style={{ background: getCardBg() }}>
        <div
          className="onboarding__variant-avatar"
          style={{
            background: avatarPreview ? 'none' : `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
          }}
        >
          {avatarPreview
            ? <img src={avatarPreview} alt="avatar" />
            : variant.full_name?.[0]?.toUpperCase()
          }
        </div>
        <div className="onboarding__variant-name" style={{ color: nameColor }}>
          {variant.full_name}
        </div>
        <div className="onboarding__variant-bio" style={{ color: bioColor }}>
          {variant.bio}
        </div>
        <div className="onboarding__variant-links">
          {variant.links?.slice(0, 3).map((link, i) => (
            <div key={i} className="onboarding__variant-link" style={getLinkStyle(i)}>
              {link.title}
            </div>
          ))}
        </div>
        <div className="onboarding__variant-theme-badge" style={{ color: bioColor }}>
          {theme.name}
        </div>
      </div>

      {selected && <div className="onboarding__variant-check">✓ Selected</div>}
    </button>
  )
}

function Onboarding({ user, profile, onComplete }) {
  const [step, setStep]                   = useState(1)
  const [socialInput, setSocialInput]     = useState('')
  const [avatarFile, setAvatarFile]       = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [loading, setLoading]             = useState(false)
  const [loadingStep, setLoadingStep]     = useState(0)
  const [variants, setVariants]           = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [error, setError]                 = useState('')
  const [usernameInput, setUsernameInput] = useState('')
  const fileInputRef = useRef(null)

  // Google OAuth users arrive without a username — we collect it during onboarding
  const isGoogleUser = !profile?.username

  useEffect(() => {
    if (!loading) return
    setLoadingStep(0)
    const timers = LOADING_STEPS.map((_, i) =>
      setTimeout(() => setLoadingStep(i), i * 950)
    )
    return () => timers.forEach(clearTimeout)
  }, [loading])

  const handleAvatarFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return }
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSkip = async () => {
    if (isGoogleUser && !usernameInput.trim()) {
      setError('Please choose a username before continuing.')
      return
    }
    const update = { onboarding_done: true }
    if (isGoogleUser) update.username = usernameInput.trim()
    await supabase.from('profiles').upsert({ id: user.id, ...update })
    onComplete()
  }

  const handleGenerate = async () => {
    if (!socialInput.trim()) return
    if (isGoogleUser && !usernameInput.trim()) {
      setError('Please choose a username first.')
      return
    }
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
                text: `You are helping a creator set up their link-in-bio page on Vinelink. Based on this info: "${socialInput}"

Generate exactly 3 DISTINCT profile variants. Each must feel completely different — different vibe, tone, theme, and bio style. Be specific to their niche, not generic.

Respond ONLY with valid JSON (no markdown, no code blocks, no extra text):
{
  "variants": [
    {
      "label": "Bold & Creative",
      "full_name": "their real name or handle, cleaned up",
      "bio": "edgy, punchy bio under 110 chars — memorable and specific to their niche, not generic",
      "theme": "pick ONE from: neon, aurora, midnight, glass",
      "links": [
        { "title": "label that fits their brand voice", "url": "https://full-url-from-input" }
      ]
    },
    {
      "label": "Clean & Minimal",
      "full_name": "their name",
      "bio": "clean, confident bio under 110 chars — professional and clear",
      "theme": "pick ONE from: sand, paper, slate, ocean, earth",
      "links": [
        { "title": "label", "url": "https://full-url-from-input" }
      ]
    },
    {
      "label": "Warm & Personal",
      "full_name": "their name",
      "bio": "friendly, personal bio under 110 chars — feels like a real person, not a brand",
      "theme": "pick ONE from: forest, rose, candy, lavender, sunset",
      "links": [
        { "title": "label", "url": "https://full-url-from-input" }
      ]
    }
  ]
}`
              }]
            }],
            generationConfig: { temperature: 0.9, maxOutputTokens: 1500 }
          })
        }
      )

      const data = await response.json()
      const text = data.candidates[0].content.parts[0].text
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setVariants(parsed.variants)
      setSelectedIndex(0)
      setStep(2)
    } catch {
      setError('Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  const handleApply = async () => {
    if (isGoogleUser && !usernameInput.trim()) {
      setError('Please go back and choose a username first.')
      return
    }
    setLoading(true)
    const chosen = variants[selectedIndex]

    let avatarUrl = null
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop()
      const filePath = `${user.id}/avatar.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('avatars').upload(filePath, avatarFile, { upsert: true })
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
        avatarUrl = publicUrl
      }
    }

    await supabase.from('profiles').upsert({
      id: user.id,
      ...(isGoogleUser && usernameInput.trim() && { username: usernameInput.trim() }),
      full_name: chosen.full_name,
      bio: chosen.bio,
      theme: chosen.theme,
      onboarding_done: true,
      ...(avatarUrl && { avatar_url: avatarUrl }),
    })

    if (chosen.links?.length > 0) {
      await supabase.from('links').insert(
        chosen.links.map((link, i) => ({
          user_id: user.id,
          title: link.title,
          url: link.url.startsWith('http') ? link.url : 'https://' + link.url,
          position: i,
          active: true,
        }))
      )
    }

    setLoading(false)
    onComplete()
  }

  return (
    <div className="onboarding">
      <div className={`onboarding__container${step === 2 ? ' onboarding__container--wide' : ''}`}>

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
              Describe yourself and paste your links. We'll generate 3 unique profiles for you to pick from.
            </p>

            <div className="onboarding__avatar-section">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                style={{ display: 'none' }}
              />
              <button
                className="onboarding__avatar-upload"
                onClick={() => fileInputRef.current.click()}
                type="button"
              >
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" className="onboarding__avatar-img" />
                  : (
                    <>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="4"/>
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                      </svg>
                      <span>Add photo</span>
                    </>
                  )
                }
              </button>
              <span className="onboarding__avatar-hint">
                {avatarPreview ? 'Click to change' : 'Optional — add a profile photo'}
              </span>
            </div>

            {isGoogleUser && (
              <div className="onboarding__username-field">
                <label className="onboarding__username-label">Choose your username</label>
                <div className="onboarding__username-row">
                  <input
                    className="onboarding__username-input"
                    type="text"
                    placeholder="yourname"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  />
                  <span className="onboarding__username-suffix">.vinelink.xyz</span>
                </div>
              </div>
            )}

            <textarea
              className="onboarding__textarea"
              placeholder={`Tell us about yourself and paste your links, for example:\n\nI'm a travel photographer based in NYC\n\nInstagram: instagram.com/johndoe\nYouTube: youtube.com/johndoe\nWebsite: johndoe.com`}
              value={socialInput}
              onChange={(e) => setSocialInput(e.target.value)}
              rows={6}
            />

            {error && <div className="onboarding__error">{error}</div>}

            {loading ? (
              <div className="onboarding__loading-steps">
                {LOADING_STEPS.map((s, i) => (
                  <div
                    key={i}
                    className={`onboarding__loading-step ${i < loadingStep ? 'onboarding__loading-step--done' : ''} ${i === loadingStep ? 'onboarding__loading-step--active' : ''}`}
                  >
                    <div className="onboarding__loading-icon">
                      {i < loadingStep ? '✓' : i === loadingStep ? <span className="onboarding__spinner" /> : '·'}
                    </div>
                    {s}
                  </div>
                ))}
              </div>
            ) : (
              <button className="onboarding__btn" onClick={handleGenerate} disabled={!socialInput.trim()}>
                ✨ Generate 3 profile ideas
              </button>
            )}

            <button className="onboarding__skip" onClick={handleSkip}>
              Skip and set up manually →
            </button>
          </div>
        )}

        {step === 2 && variants.length > 0 && (
          <div className="onboarding__step">
            <div className="onboarding__badge">🎨 Pick your style</div>
            <h1 className="onboarding__title">Choose a vibe</h1>
            <p className="onboarding__subtitle">
              Three unique profiles — pick the one that feels most like you.
            </p>

            <div className="onboarding__variants">
              {variants.map((variant, i) => (
                <VariantCard
                  key={i}
                  variant={variant}
                  avatarPreview={avatarPreview}
                  selected={selectedIndex === i}
                  onSelect={() => setSelectedIndex(i)}
                />
              ))}
            </div>

            <div className="onboarding__actions">
              <button className="onboarding__btn" onClick={handleApply} disabled={loading}>
                {loading ? 'Applying...' : '🚀 Apply and go to dashboard'}
              </button>
              <button className="onboarding__skip" onClick={() => { setStep(1); setVariants([]) }}>
                ← Try again with different info
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default Onboarding
