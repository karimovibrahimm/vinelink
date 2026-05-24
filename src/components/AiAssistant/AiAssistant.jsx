import { useState, useRef, useEffect } from 'react'
import { getThemeById } from '../../lib/themes'
import './AiAssistant.css'


function ProposedChanges({ applyData, profile, links, onApply, onDismiss }) {
  const currentTheme = getThemeById(profile?.theme)
  const proposedTheme = applyData.theme ? getThemeById(applyData.theme) : currentTheme
  const proposedName = applyData.full_name || profile?.full_name
  const proposedBio = applyData.bio || profile?.bio

  const displayLinks = (links || []).slice(0, 3).map(l => {
    const override = applyData.links?.find(al => al.id === l.id)
    return { ...l, title: override?.title || l.title }
  })

  const getBg = () => {
    const t = proposedTheme
    if (t.id === 'aurora')   return 'linear-gradient(160deg, #0a1628 0%, #0d2040 100%)'
    if (t.id === 'glass')    return 'linear-gradient(135deg, #16213e 0%, #0f3460 100%)'
    if (t.id === 'neon')     return '#0a0a0a'
    if (t.id === 'midnight') return 'radial-gradient(ellipse at 50% 0%, rgba(122,106,202,0.3) 0%, transparent 60%), #0d0d1a'
    return `linear-gradient(160deg, ${t.bgGradient} 0%, ${t.bg} 60%)`
  }

  const getLinkStyle = (i) => {
    const t = proposedTheme
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

  const nameColor = proposedTheme.textColor || proposedTheme.primary
  const bioColor = proposedTheme.subtextColor || (proposedTheme.style === 'dark' ? 'rgba(255,255,255,0.6)' : '#888')

  return (
    <div className="ai-preview-card">
      <div className="ai-preview-label">Proposed design</div>
      <div className="ai-preview-screen" style={{ background: getBg() }}>
        <div className="ai-preview-avatar" style={{ background: `linear-gradient(135deg, ${proposedTheme.primary}, ${proposedTheme.accent})` }}>
          {proposedName?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="ai-preview-name" style={{ color: nameColor }}>{proposedName}</div>
        {proposedBio && <div className="ai-preview-bio" style={{ color: bioColor }}>{proposedBio}</div>}
        <div className="ai-preview-links">
          {displayLinks.map((link, i) => (
            <div key={link.id} className="ai-preview-link" style={getLinkStyle(i)}>{link.title}</div>
          ))}
        </div>
      </div>
      <div className="ai-preview-actions">
        <button className="ai-preview-apply" onClick={onApply}>Apply changes</button>
        <button className="ai-preview-dismiss" onClick={onDismiss}>Dismiss</button>
      </div>
    </div>
  )
}

function AiAssistant({ user, profile, links, onApply }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: `Hey @${profile?.username}! 👋 I'm your Vinelink AI. Tell me what you want to improve — bio, theme, link titles, or the full page — and I'll show you a new design to apply instantly.`
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(new Set())
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const buildContext = () => {
    const isPro = profile?.plan === 'pro'
    const freeThemes = 'forest, ocean, rose, sand, slate, paper, earth, sunset, lavender'
    const allThemes  = 'forest, ocean, rose, sand, slate, paper, earth, sunset, lavender, midnight, neon, aurora, glass, candy'
    return `The user's current Vinelink profile:
- Username: @${profile?.username}
- Display name: ${profile?.full_name || 'not set'}
- Bio: ${profile?.bio || 'not set'}
- Theme: ${profile?.theme || 'forest'}
- Links: ${links?.map(l => `[id:${l.id}] "${l.title}"`).join(', ') || 'none'}

You are a helpful AI assistant for Vinelink, a link-in-bio platform.

RULES:
1. Keep response text SHORT — 2-4 sentences max. Be friendly and direct.
2. Whenever you suggest ANY change to bio, name, theme, or link titles — ALWAYS include an <apply> block. Do NOT wait for the user to ask.
3. Put the <apply> block at the very END of your response, after your message.
4. Available themes: ${isPro ? allThemes : freeThemes}

<apply> block format — only include fields that are changing:
<apply>
{
  "full_name": "optional new name",
  "bio": "optional new bio under 160 chars",
  "theme": "optional theme id from the list above",
  "links": [{ "id": "existing-link-id", "title": "new title" }]
}
</apply>`
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg = { role: 'user', text: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const historyText = newMessages
        .map(m => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.text}`)
        .join('\n')

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${buildContext()}\n\nConversation:\n${historyText}\n\nRespond to the user's latest message.`,
          temperature: 0.7,
          maxTokens: 1500,
        }),
      })

      const { text, error: aiError } = await response.json()
      if (aiError) throw new Error(aiError)
      if (!text) throw new Error('No AI response')

      const applyMatch = text.match(/<apply>([\s\S]*?)<\/apply>/)
      const displayText = text.replace(/<apply>[\s\S]*?<\/apply>/, '').trim()

      let applyData = null
      if (applyMatch) {
        try { applyData = JSON.parse(applyMatch[1].trim()) }
        catch (e) { /* malformed JSON */ }
      }

      setMessages(prev => [...prev, { role: 'assistant', text: displayText, applyData }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, something went wrong. Try again!' }])
    }

    setLoading(false)
  }

  const handleApply = async (applyData, msgIndex) => {
    await onApply(applyData)
    setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, applied: true } : m))
  }

  const dismiss = (i) => setDismissed(prev => new Set([...prev, i]))

  return (
    <>
      <button
        className={`ai-assistant__fab ${open ? 'ai-assistant__fab--open' : ''}`}
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/>
            <path d="M8 12h.01M12 12h.01M16 12h.01"/>
          </svg>
        )}
        {!open && <span>AI Assistant</span>}
      </button>

      {open && (
        <div className="ai-assistant__panel">
          <div className="ai-assistant__header">
            <div className="ai-assistant__header-info">
              <div className="ai-assistant__avatar">✨</div>
              <div>
                <div className="ai-assistant__name">Vinelink AI</div>
                <div className="ai-assistant__status">
                  <div className="ai-assistant__dot"></div>
                  Online
                </div>
              </div>
            </div>
            <button className="ai-assistant__close" onClick={() => setOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="ai-assistant__messages">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-assistant__message ai-assistant__message--${msg.role}`}>
                {msg.text && <div className="ai-assistant__bubble">{msg.text}</div>}
                {msg.applyData && !msg.applied && !dismissed.has(i) && (
                  <ProposedChanges
                    applyData={msg.applyData}
                    profile={profile}
                    links={links}
                    onApply={() => handleApply(msg.applyData, i)}
                    onDismiss={() => dismiss(i)}
                  />
                )}
                {msg.applied && <div className="ai-preview-applied">✓ Changes applied!</div>}
              </div>
            ))}

            {loading && (
              <div className="ai-assistant__message ai-assistant__message--assistant">
                <div className="ai-assistant__bubble ai-assistant__bubble--loading">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-assistant__suggestions">
            {['Improve my bio', 'Suggest a theme', 'Better link titles', 'Redesign my page'].map(s => (
              <button key={s} className="ai-assistant__suggestion" onClick={() => setInput(s)}>{s}</button>
            ))}
          </div>

          <div className="ai-assistant__input-row">
            <input
              className="ai-assistant__input"
              placeholder="Ask anything about your page..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="ai-assistant__send" onClick={handleSend} disabled={loading || !input.trim()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default AiAssistant
