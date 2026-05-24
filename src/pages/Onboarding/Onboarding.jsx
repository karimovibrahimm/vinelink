import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { getThemeById } from '../../lib/themes'
import usePageMeta from '../../lib/usePageMeta'
import './Onboarding.css'


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
          style={{ background: avatarPreview ? 'none' : `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}
        >
          {avatarPreview ? <img src={avatarPreview} alt="avatar" /> : variant.full_name?.[0]?.toUpperCase()}
        </div>
        <div className="onboarding__variant-name" style={{ color: nameColor }}>{variant.full_name}</div>
        <div className="onboarding__variant-bio" style={{ color: bioColor }}>{variant.bio}</div>
        <div className="onboarding__variant-links">
          {variant.links?.slice(0, 3).map((link, i) => (
            <div key={i} className="onboarding__variant-link" style={getLinkStyle(i)}>{link.title}</div>
          ))}
        </div>
        <div className="onboarding__variant-theme-badge" style={{ color: bioColor }}>{theme.name}</div>
      </div>
      {selected && <div className="onboarding__variant-check">✓ Selected</div>}
    </button>
  )
}

function Onboarding({ user, profile, onComplete }) {
  usePageMeta('Set Up Your Page | Vinelink', 'Set up your Vinelink page with AI in seconds.')

  // Google OAuth users have no username — they start at step 0
  const isGoogleUser = !profile?.username

  const [step, setStep]                   = useState(isGoogleUser ? 0 : 1)
  const [usernameInput, setUsernameInput] = useState('')
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameTaken, setUsernameTaken] = useState(false)
  const [socialInput, setSocialInput]     = useState('')
  const [avatarFile, setAvatarFile]       = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [loading, setLoading]             = useState(false)
  const [loadingStep, setLoadingStep]     = useState(0)
  const [variants, setVariants]           = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [error, setError]                 = useState('')
  const fileInputRef = useRef(null)

  // Username format validation
  const usernameFormatError = (() => {
    const u = usernameInput
    if (!u) return ''
    if (u.length < 3)  return 'At least 3 characters'
    if (u.length > 32) return 'Max 32 characters'
    if (!/^[a-z0-9-]+$/.test(u)) return 'Only lowercase letters, numbers, and hyphens'
    if (/^-|-$/.test(u)) return 'Cannot start or end with a hyphen'
    if (/--/.test(u))    return 'No consecutive hyphens'
    return ''
  })()

  const usernameError = usernameFormatError || (usernameTaken ? 'This username is already taken' : '')
  const usernameValid = usernameInput && !usernameError && !usernameChecking

  // Debounced availability check
  useEffect(() => {
    setUsernameTaken(false)
    if (!usernameInput || usernameFormatError) return
    setUsernameChecking(true)
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', usernameInput)
        .maybeSingle()
      setUsernameTaken(!!data)
      setUsernameChecking(false)
    }, 500)
    return () => clearTimeout(t)
  }, [usernameInput, usernameFormatError])

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

  const handleUsernameNext = () => {
    if (!usernameValid) return
    setError('')
    setStep(1)
  }

  const handleSkip = async () => {
    const update = { onboarding_done: true }
    if (isGoogleUser) update.username = usernameInput.trim()
    await supabase.from('profiles').update(update).eq('id', user.id)
    onComplete()
  }

  const handleGenerate = async () => {
    if (!socialInput.trim()) return
    if (socialInput.trim().length > 2000) {
      setError('Please keep your description under 2000 characters.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are helping a creator set up their link-in-bio page on Vinelink. Based on this info: "${socialInput}"

Generate exactly 3 DISTINCT profile variants. Each must feel completely different — different vibe, tone, theme, and bio style. Be specific to their niche, not generic.

Respond ONLY with valid JSON (no markdown, no code blocks, no extra text):
{
  "variants": [
    {
      "label": "Bold & Creative",
      "full_name": "their real name or handle, cleaned up",
      "bio": "edgy, punchy bio under 110 chars — memorable and specific to their niche, not generic",
      "theme": "pick ONE from: slate, ocean, earth, sand",
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
      "theme": "pick ONE from: forest, rose, lavender, sunset",
      "links": [
        { "title": "label", "url": "https://full-url-from-input" }
      ]
    }
  ]
}`,
          temperature: 0.9,
          maxTokens: 1500,
        }),
      })

      const { text, error: aiError } = await response.json()
      if (aiError) throw new Error(aiError)
      const clean = (text || '').replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setVariants(parsed.variants)
      setSelectedIndex(0)
      setStep(isGoogleUser ? 2 : 2)
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  const handleApply = async () => {
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

    await supabase.from('profiles').update({
      ...(isGoogleUser && { username: usernameInput.trim() }),
      full_name: chosen.full_name,
      bio: chosen.bio,
      theme: chosen.theme,
      onboarding_done: true,
      ...(avatarUrl && { avatar_url: avatarUrl }),
    }).eq('id', user.id)

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

  // Step dots: Google users have 3 steps (0,1,2), email users have 2 (1,2)
  const totalSteps  = isGoogleUser ? 3 : 2
  const currentDot  = isGoogleUser ? step : step - 1

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

        {/* Step dots */}
        <div className="onboarding__steps">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span key={i} style={{ display: 'contents' }}>
              {i > 0 && <div className="onboarding__step-line" />}
              <div className={`onboarding__step-dot${currentDot >= i ? ' onboarding__step-dot--active' : ''}`} />
            </span>
          ))}
        </div>

        {/* ── Step 0: Username (Google users only) ── */}
        {step === 0 && (
          <div className="onboarding__step">
            <div className="onboarding__badge">👋 Welcome</div>
            <h1 className="onboarding__title">Choose your username</h1>
            <p className="onboarding__subtitle">
              This is your unique Vinelink address. You can't change it later.
            </p>

            <div className="onboarding__username-field">
              <div className={`onboarding__username-row${
                usernameInput && usernameError ? ' onboarding__username-row--error' :
                usernameValid ? ' onboarding__username-row--valid' : ''
              }`}>
                <input
                  className="onboarding__username-input"
                  type="text"
                  placeholder="yourname"
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    setError('')
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleUsernameNext()}
                  autoFocus
                />
                <span className="onboarding__username-suffix">.vinelink.xyz</span>
              </div>

              {usernameInput && usernameChecking && (
                <span className="onboarding__username-status onboarding__username-status--checking">
                  Checking availability…
                </span>
              )}
              {usernameInput && !usernameChecking && usernameError && (
                <span className="onboarding__username-status onboarding__username-status--error">
                  {usernameError}
                </span>
              )}
              {usernameValid && (
                <span className="onboarding__username-status onboarding__username-status--valid">
                  ✓ {usernameInput}.vinelink.xyz is available
                </span>
              )}
            </div>

            {error && <div className="onboarding__error">{error}</div>}

            <button
              className="onboarding__btn"
              onClick={handleUsernameNext}
              disabled={!usernameValid}
            >
              Continue →
            </button>
          </div>
        )}

        {/* ── Step 1: AI setup ── */}
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

            <textarea
              className="onboarding__textarea"
              placeholder={`Tell us about yourself and paste your links, for example:\n\nI'm a travel photographer based in NYC\n\nInstagram: instagram.com/johndoe\nYouTube: youtube.com/johndoe\nWebsite: johndoe.com`}
              value={socialInput}
              onChange={(e) => setSocialInput(e.target.value)}
              rows={6}
              maxLength={2000}
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

        {/* ── Step 2: Pick variant ── */}
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
