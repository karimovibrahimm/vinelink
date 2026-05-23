import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

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

  const resend = new Resend(process.env.RESEND_API_KEY)
  const from   = `${senderName} via VineLink <${fromAddress}>`

  try {
    const emails = subscribers.map(s => ({ from, to: s.email, subject, html }))
    const BATCH  = 100
    let sent     = 0
    for (let i = 0; i < emails.length; i += BATCH) {
      const { error } = await resend.batch.send(emails.slice(i, i + BATCH))
      if (error) return res.status(500).json({ error: error.message || JSON.stringify(error) })
      sent += Math.min(BATCH, emails.length - i)
    }
    await supabase.from('newsletter_sends').insert({ user_id: user.id })
    res.json({ sent })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
