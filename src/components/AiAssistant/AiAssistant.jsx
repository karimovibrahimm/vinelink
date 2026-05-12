import { useState } from 'react'
import './AiAssistant.css'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

function AiAssistant({ user, profile, links, onApply }) {
  const [open, setOpen] = useState(false)

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hey @${profile?.username}! 👋 I'm your Vinelink AI assistant. I can help you redesign your page, suggest better link titles, pick a theme, or rewrite your bio. What would you like to improve?`
    }
  ])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const buildContext = () => {
    return `The user's current Vinelink profile:
- Username: @${profile?.username}
- Display name: ${profile?.full_name || 'not set'}
- Bio: ${profile?.bio || 'not set'}
- Theme: ${profile?.theme || 'forest'}
- Links: ${links?.map(l => `"${l.title}" → ${l.url}`).join(', ') || 'none'}

You are a helpful assistant for Vinelink, a link-in-bio platform.

Help the user improve their page.

When suggesting changes, be specific and actionable.

If the user asks to apply changes
(new bio, theme, link titles etc),
respond with a JSON block at the END like this:

<apply>
{
  "full_name": "optional",
  "bio": "optional",
  "theme": "optional",
  "links": [
    {
      "id": "existing-link-id",
      "title": "new title"
    }
  ]
}
</apply>

Only include fields that are changing.
Keep responses concise and friendly.`
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg = {
      role: 'user',
      text: input
    }

    const newMessages = [...messages, userMsg]

    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const historyText = newMessages
        .map(m =>
          `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.text}`
        )
        .join('\n')

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `
${buildContext()}

Conversation:
${historyText}

Respond to the user's latest message.
                    `
                  }
                ]
              }
            ],

            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800
            }
          })
        }
      )

      const data = await response.json()

      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text

      if (!text) {
        console.log(data)
        throw new Error('No AI response')
      }

      const applyMatch = text.match(
        /<apply>([\s\S]*?)<\/apply>/
      )

      let displayText = text
        .replace(/<apply>[\s\S]*?<\/apply>/, '')
        .trim()

      let applyData = null

      if (applyMatch) {
        try {
          applyData = JSON.parse(applyMatch[1].trim())
        } catch (e) {
          console.log('Apply JSON parse failed')
        }
      }

      const assistantMsg = {
        role: 'assistant',
        text: displayText,
        applyData
      }

      setMessages(prev => [...prev, assistantMsg])

    } catch (e) {
      console.error(e)

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'Sorry, something went wrong. Try again!'
        }
      ])
    }

    setLoading(false)
  }

  const handleApply = async (applyData) => {
    await onApply(applyData)

    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        text: '✅ Done! Your page has been updated.'
      }
    ])
  }

  return (
    <>
      {/* Floating button */}
      <button
        className={`ai-assistant__fab ${
          open ? 'ai-assistant__fab--open' : ''
        }`}
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/>
            <path d="M8 12h.01M12 12h.01M16 12h.01"/>
          </svg>
        )}

        {!open && <span>AI Assistant</span>}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="ai-assistant__panel">

          <div className="ai-assistant__header">

            <div className="ai-assistant__header-info">

              <div className="ai-assistant__avatar">
                ✨
              </div>

              <div>
                <div className="ai-assistant__name">
                  Vinelink AI
                </div>

                <div className="ai-assistant__status">
                  <div className="ai-assistant__dot"></div>
                  Online
                </div>
              </div>

            </div>

            <button
              className="ai-assistant__close"
              onClick={() => setOpen(false)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

          </div>

          <div className="ai-assistant__messages">

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`ai-assistant__message ai-assistant__message--${msg.role}`}
              >

                <div className="ai-assistant__bubble">
                  {msg.text}
                </div>

                {msg.applyData && (
                  <button
                    className="ai-assistant__apply-btn"
                    onClick={() => handleApply(msg.applyData)}
                  >
                    ✨ Apply these changes
                  </button>
                )}

              </div>
            ))}

            {loading && (
              <div className="ai-assistant__message ai-assistant__message--assistant">
                <div className="ai-assistant__bubble ai-assistant__bubble--loading">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

          </div>

          <div className="ai-assistant__suggestions">

            {[
              'Improve my bio',
              'Suggest a theme',
              'Better link titles',
              'Redesign my page'
            ].map(s => (
              <button
                key={s}
                className="ai-assistant__suggestion"
                onClick={() => setInput(s)}
              >
                {s}
              </button>
            ))}

          </div>

          <div className="ai-assistant__input-row">

            <input
              className="ai-assistant__input"
              placeholder="Ask anything about your page..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && handleSend()
              }
            />

            <button
              className="ai-assistant__send"
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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