import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import './Onboarding.css'
import { GoogleGenAI } from "@google/genai";

function Onboarding({ user, profile, onComplete }) {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
  const [step, setStep] = useState(1)
  const [socialInput, setSocialInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
  if (!socialInput.trim()) return

  setLoading(true)
  setError('')

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
                    You are helping set up a link-in-bio page.

                    Based on this social media info:
                    "${socialInput}"

                    Generate a profile for them.

                    Respond ONLY with valid JSON.
                    No markdown.
                    No explanation.

                    {
                    "full_name": "their name or username cleaned up",
                    "bio": "a punchy 1-2 sentence bio under 100 chars that fits their niche",
                    "theme": "one of: default, ocean, rose, midnight, sand, slate",
                    "links": [
                        {
                        "title": "link title",
                        "url": "the actual url they pasted or inferred"
                        }
                    ]
                    }
                                    `
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1000
          }
        })
      }
    )

    const data = await response.json()

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    const clean = text.replace(/```json|```/g, '').trim()

    const parsed = JSON.parse(clean)

    setResult(parsed)
    setStep(2)
  } catch (e) {
    console.error(e)
    setError('Something went wrong. Try again.')
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

  const themes = {
    default: { primary: '#1a3a2a', accent: '#c9a84c', bg: '#f7f5f0' },
    ocean:   { primary: '#1a2e4a', accent: '#4a9eca', bg: '#f0f5fa' },
    rose:    { primary: '#4a1a2e', accent: '#ca4a7a', bg: '#faf0f3' },
    midnight:{ primary: '#1a1a2e', accent: '#7a6aca', bg: '#f0f0fa' },
    sand:    { primary: '#3a2e1a', accent: '#ca9a4a', bg: '#faf5f0' },
    slate:   { primary: '#1a2a3a', accent: '#4acaca', bg: '#f0f5f5' },
  }

  const activeTheme = result ? (themes[result.theme] || themes.default) : themes.default

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

        {step === 1 && (
          <div className="onboarding__step">
            <div className="onboarding__badge">✨ AI Setup</div>
            <h1 className="onboarding__title">Let AI build your page</h1>
            <p className="onboarding__subtitle">
              Paste your Instagram, YouTube, TikTok, or any social links below. Our AI will build your entire Vinelink page in seconds.
            </p>

            <textarea
              className="onboarding__textarea"
              placeholder={`Paste your links and a short description, for example:\n\nInstagram: instagram.com/johndoe\nYouTube: youtube.com/johndoe\nI'm a travel photographer based in NYC`}
              value={socialInput}
              onChange={(e) => setSocialInput(e.target.value)}
              rows={6}
            />

            {error && <div className="onboarding__error">{error}</div>}

            <button
              className="onboarding__btn"
              onClick={handleGenerate}
              disabled={loading || !socialInput.trim()}
            >
              {loading ? (
                <><span className="onboarding__spinner"></span> Building your page...</>
              ) : (
                '✨ Build my Vinelink page'
              )}
            </button>

            <button
              className="onboarding__skip"
              onClick={onComplete}
            >
              Skip and set up manually →
            </button>
          </div>
        )}

        {step === 2 && result && (
          <div className="onboarding__step">
            <div className="onboarding__badge">🎉 Your page is ready</div>
            <h1 className="onboarding__title">Looking good, {result.full_name}!</h1>
            <p className="onboarding__subtitle">Here's what AI created for you. You can edit everything after.</p>

            {/* Preview card */}
            <div
              className="onboarding__preview"
              style={{ background: `linear-gradient(160deg, ${activeTheme.bg} 0%, #fff 100%)` }}
            >
              <div
                className="onboarding__preview-avatar"
                style={{ background: `linear-gradient(135deg, ${activeTheme.primary}, ${activeTheme.accent})` }}
              >
                {result.full_name?.[0]?.toUpperCase()}
              </div>
              <div className="onboarding__preview-name" style={{ color: activeTheme.primary }}>
                {result.full_name}
              </div>
              <div className="onboarding__preview-bio">{result.bio}</div>
              <div className="onboarding__preview-links">
                {result.links?.map((link, i) => (
                  <div
                    key={i}
                    className="onboarding__preview-link"
                    style={i === 0 ? {
                      background: activeTheme.primary,
                      color: '#fff',
                      borderColor: activeTheme.primary
                    } : { borderColor: `${activeTheme.primary}22`, color: activeTheme.primary }}
                  >
                    {link.title}
                  </div>
                ))}
              </div>
              <div className="onboarding__preview-theme">
                Theme: <strong>{result.theme}</strong>
              </div>
            </div>

            <div className="onboarding__actions">
              <button
                className="onboarding__btn"
                onClick={handleApply}
                disabled={loading}
              >
                {loading ? 'Applying...' : '🚀 Apply and go to dashboard'}
              </button>
              <button
                className="onboarding__skip"
                onClick={() => { setStep(1); setResult(null) }}
              >
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