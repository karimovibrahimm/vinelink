const crypto = require('crypto')

// Polar uses Standard Webhooks spec: HMAC-SHA256 over "id.timestamp.body"
function verifySignature(rawBody, headers, secret) {
  const msgId        = headers['webhook-id']
  const msgTimestamp = headers['webhook-timestamp']
  const msgSignature = headers['webhook-signature']

  if (!msgId || !msgTimestamp || !msgSignature) return false

  // Reject messages older than 5 minutes
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(msgTimestamp, 10)) > 300) return false

  const signedContent = `${msgId}.${msgTimestamp}.${rawBody}`
  const secretBytes   = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const computed      = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64')

  // msgSignature may contain multiple sigs: "v1,<sig1> v1,<sig2>"
  return msgSignature.split(' ').some(sig => {
    const [, value] = sig.split(',')
    return value === computed
  })
}

// Supabase admin client (service role — bypasses RLS)
async function updatePlan(userId, plan) {
  const res = await fetch(
    `${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: {
        apikey:        process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ plan }),
    }
  )
  if (!res.ok) throw new Error(`Supabase update failed: ${res.status}`)
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = JSON.stringify(req.body)

  if (!verifySignature(rawBody, req.headers, process.env.POLAR_WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const { type, data } = req.body
  const userId = data?.metadata?.user_id

  try {
    switch (type) {
      case 'subscription.created':
      case 'subscription.updated':
        if (userId) {
          const plan = data.status === 'active' ? 'pro' : 'free'
          await updatePlan(userId, plan)
        }
        break

      case 'subscription.canceled':
      case 'subscription.revoked':
        if (userId) await updatePlan(userId, 'free')
        break
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    res.status(500).json({ error: err.message })
  }
}
