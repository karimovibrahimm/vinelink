const express    = require('express')
const https      = require('https')
const { Resend } = require('resend')
const { createClient } = require('@supabase/supabase-js')

const app = express()
app.use(express.json())

app.post('/api/subscribe', async (req, res) => {
  const { blockId, userId, email } = req.body || {}
  if (!blockId || !userId || !email) return res.status(400).json({ error: 'Missing fields.' })
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const { data: block } = await supabase.from('blocks').select('id')
    .eq('id', blockId).eq('user_id', userId).eq('type', 'newsletter').eq('active', true).single()
  if (!block) return res.status(404).json({ error: 'Newsletter not found.' })
  const { count } = await supabase.from('newsletter_subscribers')
    .select('*', { count: 'exact', head: true }).eq('block_id', blockId)
  if (count >= 10000) return res.status(400).json({ error: 'Not accepting new subscribers.' })
  const { error } = await supabase.from('newsletter_subscribers')
    .upsert({ block_id: blockId, user_id: userId, email: email.trim() }, { onConflict: 'block_id,email', ignoreDuplicates: true })
  if (error) return res.status(500).json({ error: 'Could not subscribe.' })
  res.json({ ok: true })
})

app.post('/api/ai', async (req, res) => {
  const { prompt, temperature = 0.7, maxTokens = 1500 } = req.body || {}
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' })
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'AI not configured' })

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        }),
      }
    )
    const data = await r.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return res.status(500).json({ error: 'No response from AI' })
    res.json({ text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/polar-checkout', async (req, res) => {
  const { userId, email } = req.body || {}
  if (!userId || !email) return res.status(400).json({ error: 'Missing userId or email' })
  if (!process.env.POLAR_ACCESS_TOKEN || !process.env.POLAR_PRODUCT_ID) {
    return res.status(500).json({ error: 'Missing POLAR_ACCESS_TOKEN or POLAR_PRODUCT_ID' })
  }

  const payload = JSON.stringify({
    product_id: process.env.POLAR_PRODUCT_ID,
    success_url: `${process.env.VITE_SITE_URL || 'http://localhost:5173'}/dashboard?upgraded=1`,
    customer_email: email,
    metadata: { user_id: userId },
  })

  try {
    const result = await new Promise((resolve, reject) => {
      const u   = new URL('https://api.polar.sh/v1/checkouts')
      const req = https.request(
        { hostname: u.hostname, path: u.pathname, method: 'POST',
          headers: { Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } },
        (r) => { let raw = ''; r.on('data', c => raw += c); r.on('end', () => { try { resolve({ status: r.statusCode, body: JSON.parse(raw) }) } catch { resolve({ status: r.statusCode, body: raw }) } }) }
      )
      req.on('error', reject)
      req.write(payload)
      req.end()
    })

    if (result.status >= 400) {
      const detail = typeof result.body === 'object' ? (result.body.detail || result.body.message || JSON.stringify(result.body)) : String(result.body)
      return res.status(400).json({ error: `Polar: ${detail}` })
    }
    res.json({ url: result.body.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/polar-portal', async (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' })

  const polarHeaders = {
    Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  }

  try {
    // Look up Polar customer by email
    const customerRes = await fetch(
      `https://api.polar.sh/v1/customers?email=${encodeURIComponent(user.email)}&limit=1`,
      { headers: polarHeaders }
    )
    const customerData = await customerRes.json()
    const customer = customerData?.items?.[0] || customerData?.result?.items?.[0]

    if (!customer?.id) {
      return res.status(404).json({ error: 'No Polar customer found for this account. Make sure you have an active subscription.' })
    }

    // Create portal session with customer_id
    const sessionRes = await fetch('https://api.polar.sh/v1/customer-sessions', {
      method: 'POST',
      headers: polarHeaders,
      body: JSON.stringify({ customer_id: customer.id }),
    })
    const sessionData = await sessionRes.json()
    console.log('[polar-portal] session status:', sessionRes.status, JSON.stringify(sessionData))

    if (!sessionRes.ok) {
      const detail = Array.isArray(sessionData.detail) ? JSON.stringify(sessionData.detail) : (sessionData.detail || sessionData.message || JSON.stringify(sessionData))
      return res.status(400).json({ error: `Polar ${sessionRes.status}: ${detail}` })
    }

    const url = sessionData.customer_portal_url || sessionData.url
    if (!url) return res.status(500).json({ error: `Polar returned: ${JSON.stringify(sessionData)}` })
    res.json({ url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/send-newsletter', async (req, res) => {
  const { blockId, subject, body, token } = req.body || {}
  if (!blockId || !subject?.trim() || !body?.trim() || !token) {
    return res.status(400).json({ error: 'Missing required fields.' })
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY is not configured.' })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized.' })

  const { data: block } = await supabase
    .from('blocks')
    .select('id, data')
    .eq('id', blockId)
    .eq('user_id', user.id)
    .eq('type', 'newsletter')
    .single()

  if (!block) return res.status(404).json({ error: 'Newsletter block not found.' })

  const { data: subscribers } = await supabase
    .from('newsletter_subscribers')
    .select('email')
    .eq('block_id', blockId)
    .eq('user_id', user.id)

  if (!subscribers?.length) return res.status(400).json({ error: 'No subscribers to send to.' })

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, plan')
    .eq('id', user.id)
    .single()

  // Free plan: 1 send per month
  if (profile?.plan !== 'pro') {
    const start = new Date()
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('newsletter_sends')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('sent_at', start.toISOString())
    if (count >= 1) return res.status(429).json({ error: 'free_limit_reached' })
  }

  const senderName  = profile?.full_name || profile?.username || 'VineLink'
  const fromAddress = process.env.RESEND_FROM_EMAIL || 'hello@vinelink.xyz'
  const profileUrl  = `https://vinelink.xyz/${profile?.username || ''}`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#1a3a2a;padding:28px 36px;">
      <div style="color:#fff;font-size:20px;font-weight:700;">${senderName}</div>
      <div style="color:rgba(255,255,255,0.6);font-size:13px;margin-top:3px;">Newsletter</div>
    </div>
    <div style="padding:32px 36px;">
      <h1 style="margin:0 0 20px;font-size:22px;color:#1a1a1a;line-height:1.3;">${subject}</h1>
      <div style="font-size:15px;color:#444;line-height:1.75;white-space:pre-wrap;">${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>
    <div style="padding:20px 36px;border-top:1px solid #f0f0f0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#aaa;">
        You received this because you subscribed at
        <a href="${profileUrl}" style="color:#1a3a2a;text-decoration:none;">${profileUrl}</a>
      </p>
    </div>
  </div>
</body>
</html>`

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const from   = `${senderName} via VineLink <${fromAddress}>`
    const emails = subscribers.map(s => ({ from, to: s.email, subject, html }))
    const BATCH  = 100
    let sent     = 0
    for (let i = 0; i < emails.length; i += BATCH) {
      const { data, error } = await resend.batch.send(emails.slice(i, i + BATCH))
      if (error) return res.status(500).json({ error: error.message || JSON.stringify(error) })
      sent += Math.min(BATCH, emails.length - i)
    }
    const { error: insertErr } = await supabase.from('newsletter_sends').insert({ user_id: user.id })
    if (insertErr) console.error('[newsletter_sends insert]', insertErr)
    res.json({ sent })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = 4000
app.listen(PORT, () => console.log(`API server on http://localhost:${PORT}`))
