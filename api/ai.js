import { rateLimit } from './_rateLimit.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!await rateLimit(req, res, 'ai', 20, 900)) return

  const { prompt, temperature = 0.7, maxTokens = 1500 } = req.body || {}
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' })
  if (typeof prompt !== 'string' || prompt.length > 4000)
    return res.status(400).json({ error: 'Prompt too long (max 4000 chars)' })

  const safeTemp   = Math.max(0, Math.min(1, Number(temperature) || 0.7))
  const safeTokens = Math.max(1, Math.min(2048, Math.floor(Number(maxTokens)) || 1500))

  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'AI not configured' })

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: safeTemp, maxOutputTokens: safeTokens },
        }),
      }
    )

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return res.status(500).json({ error: 'No response from AI' })

    res.json({ text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
