import { createClient } from '@supabase/supabase-js'
import { rateLimit } from './_rateLimit.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!await rateLimit(req, res, 'ai', 20, 900)) return

  // Require a valid Supabase session — this is not a public LLM proxy.
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { prompt, temperature = 0.7, maxTokens = 1500 } = req.body || {}
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' })
  if (typeof prompt !== 'string' || prompt.length > 4000)
    return res.status(400).json({ error: 'Prompt too long (max 4000 chars)' })

  const safeTemp   = Math.max(0, Math.min(1, Number(temperature) || 0.7))
  const safeTokens = Math.max(1, Math.min(2048, Math.floor(Number(maxTokens)) || 1500))

  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'AI not configured' })

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: safeTemp,
        max_tokens: safeTokens,
      }),
    })

    const data = await response.json()

    if (data?.error) return res.status(500).json({ error: `Groq: ${data.error.message || JSON.stringify(data.error)}` })

    const text = data?.choices?.[0]?.message?.content
    if (!text) return res.status(500).json({ error: 'No response from AI' })

    res.json({ text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
