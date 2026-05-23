const express    = require('express')
const https      = require('https')
const { Resend } = require('resend')
const { createClient } = require('@supabase/supabase-js')

const app = express()
app.use(express.json())

app.post('/api/polar-checkout', async (req, res) => {
  const { userId, email } = req.body || {}
  if (!userId || !email) return res.status(400).json({ error: 'Missing userId or email' })
  if (!process.env.POLAR_ACCESS_TOKEN || !process.env.POLAR_PRICE_ID) {
    return res.status(500).json({ error: 'Missing POLAR_ACCESS_TOKEN or POLAR_PRICE_ID' })
  }

  const payload = JSON.stringify({
    product_price_id: process.env.POLAR_PRICE_ID,
    success_url: `${process.env.VITE_SITE_URL || 'http://localhost:5173'}/dashboard?upgraded=1`,
    customer_email: email,
    metadata: { user_id: userId },
  })

  try {
    const result = await new Promise((resolve, reject) => {
      const u   = new URL('https://api.polar.sh/v1/checkouts/custom')
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

  try {
    const payload = JSON.stringify({ customer_email: user.email })
    const result = await new Promise((resolve, reject) => {
      const u = new URL('https://api.polar.sh/v1/customer-sessions')
      const r = https.request(
        { hostname: u.hostname, path: u.pathname, method: 'POST',
          headers: { Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } },
        (resp) => { let raw = ''; resp.on('data', c => raw += c); resp.on('end', () => { try { resolve({ status: resp.statusCode, body: JSON.parse(raw) }) } catch { resolve({ status: resp.statusCode, body: raw }) } }) }
      )
      r.on('error', reject)
      r.write(payload)
      r.end()
    })

    if (result.status >= 400) {
      const detail = typeof result.body === 'object' ? (result.body.detail || result.body.message || JSON.stringify(result.body)) : String(result.body)
      return res.status(400).json({ error: `Polar: ${detail}` })
    }
    res.json({ url: result.body.customer_portal_url })
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
