import { useState, useEffect } from 'react'
import './ProfileAudit.css'


const TYPE_META = {
  success: { icon: '✓', label: 'Great'       },
  warning: { icon: '⚠', label: 'Fix this'    },
  tip:     { icon: '💡', label: 'Suggestion'  },
}

export default function ProfileAudit({ profile, links, blocks, isOpen, onClose }) {
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (isOpen && !result) runAudit()
  }, [isOpen])

  const runAudit = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    const data = {
      username:   profile?.username,
      full_name:  profile?.full_name  || null,
      bio:        profile?.bio        || null,
      has_avatar: !!profile?.avatar_url,
      theme:      profile?.theme,
      links:  links.map(l  => ({ title: l.title,  url: l.url,   active: l.active })),
      blocks: blocks.map(b => ({ type:  b.type,   active: b.active })),
    }

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Audit this Vinelink profile. Be direct and specific, not generic.

Profile: ${JSON.stringify(data)}

Score 0-100 (bio quality, completeness, link quality, blocks usage). Return ONLY valid JSON, no markdown:
{"score":0-100,"headline":"one sentence","items":[{"type":"success|warning|tip","title":"max 5 words","detail":"max 20 words, specific","action_label":"label or null","action_href":"/dashboard/appearance|/dashboard/blocks|/dashboard|null"}]}

Return exactly 5 items. Keep detail fields short (under 20 words each).`,
          temperature: 0.3,
          maxTokens: 2048,
        }),
      })

      const { text, error: aiError } = await res.json()
      if (aiError) throw new Error(aiError)
      if (!text) {
        setError(`No response from AI. Status: ${res.status}`)
        setLoading(false)
        return
      }

      const start = text.indexOf('{')
      const end   = text.lastIndexOf('}')
      if (start === -1 || end === -1) throw new Error('No JSON object found in response')
      setResult(JSON.parse(text.slice(start, end + 1)))
    } catch (e) {
      setError(`Audit failed: ${e.message}`)
    }

    setLoading(false)
  }

  const score      = result?.score ?? 0
  const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <>
      <div
        className={`audit__overlay${isOpen ? ' audit__overlay--visible' : ''}`}
        onClick={onClose}
      />

      <div className={`audit__panel${isOpen ? ' audit__panel--open' : ''}`}>

        <div className="audit__header">
          <div>
            <h2 className="audit__title">Page Audit</h2>
            <p className="audit__subtitle">AI analysis of your Vinelink page</p>
          </div>
          <button className="audit__close" onClick={onClose}>✕</button>
        </div>

        {loading && (
          <div className="audit__loading">
            <div className="audit__spinner" />
            <p>Analyzing your page…</p>
          </div>
        )}

        {error && !loading && (
          <div className="audit__error">
            <p>{error}</p>
            <button onClick={runAudit}>Try again</button>
          </div>
        )}

        {result && !loading && (
          <div className="audit__content">

            <div className="audit__score-card">
              <div className="audit__score" style={{ color: scoreColor }}>{score}</div>
              <div className="audit__score-track">
                <div className="audit__score-fill" style={{ width: `${score}%`, background: scoreColor }} />
              </div>
              <p className="audit__headline">{result.headline}</p>
            </div>

            <div className="audit__items">
              {result.items?.map((item, i) => (
                <div key={i} className={`audit__item audit__item--${item.type}`}>
                  <div className="audit__item-icon">{TYPE_META[item.type]?.icon}</div>
                  <div className="audit__item-body">
                    <div className="audit__item-title">{item.title}</div>
                    <div className="audit__item-detail">{item.detail}</div>
                    {item.action_label && item.action_href && (
                      <a href={item.action_href} className="audit__item-action" onClick={onClose}>
                        {item.action_label} →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button className="audit__rerun" onClick={runAudit}>↻ Re-run audit</button>

          </div>
        )}

      </div>
    </>
  )
}
