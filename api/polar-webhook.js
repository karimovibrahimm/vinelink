const crypto = require('crypto')

module.exports.config = { api: { bodyParser: false } }

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function verifySignature(rawBody, headers, secret) {
  const msgId        = headers['webhook-id']
  const msgTimestamp = headers['webhook-timestamp']
  const msgSignature = headers['webhook-signature']
  if (!msgId || !msgTimestamp || !msgSignature) return false

  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(msgTimestamp, 10)) > 300) return false

  const signedContent = `${msgId}.${msgTimestamp}.${rawBody}`
  const secretBytes   = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const computed      = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64')

  return msgSignature.split(' ').some(sig => {
    const [, value] = sig.split(',')
    return value === computed
  })
}

async function updatePlan(userId, plan) {
  const https  = require('https')
  const url    = new URL(`${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`)
  const body   = JSON.stringify({ plan })
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        path:     url.pathname + url.search,
        method:   'PATCH',
        headers:  {
          apikey:           process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization:    `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type':   'application/json',
          Prefer:           'return=minimal',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      res => { res.resume(); resolve(res.statusCode) }
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await getRawBody(req)

  if (!verifySignature(rawBody, req.headers, process.env.POLAR_WEBHOOK_SECRET || '')) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  let payload
  try { payload = JSON.parse(rawBody) } catch { return res.status(400).json({ error: 'Invalid JSON' }) }

  const { type, data } = payload
  const userId = data?.metadata?.user_id

  try {
    if (type === 'subscription.created' || type === 'subscription.updated') {
      if (userId) await updatePlan(userId, data.status === 'active' ? 'pro' : 'free')
    } else if (type === 'subscription.canceled' || type === 'subscription.revoked') {
      if (userId) await updatePlan(userId, 'free')
    }
    res.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    res.status(500).json({ error: err.message })
  }
}
