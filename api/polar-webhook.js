import crypto from 'crypto'
import { rateLimit } from './_rateLimit.js'

async function findUserByEmail(email) {
  if (!email) return null
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const res = await fetch(
    `${process.env.VITE_SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}&page=1&per_page=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  )
  const data = await res.json()
  return data?.users?.[0]?.id || null
}

async function updatePlan(userId, plan) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ plan }),
  })
}

// Standard Webhooks (https://www.standardwebhooks.com/) signature verification.
// Polar sends webhook-id, webhook-timestamp, webhook-signature headers.
function verifySignature(webhookId, webhookTimestamp, rawBody, signatureHeader, secret) {
  const secretBytes = Buffer.from(secret.replace(/^(whsec_|polar_whs_)/, ''), 'base64')
  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`
  const computed = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64')

  // Header may contain multiple space-separated signatures ("v1,sig1 v1,sig2")
  return signatureHeader.split(' ').some(token => {
    const [version, sig] = token.split(',')
    if (version !== 'v1' || !sig) return false
    try {
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(computed))
    } catch { return false }
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Rate limit: 200 requests per minute (legitimate Polar traffic is low volume)
  if (!await rateLimit(req, res, 'webhook', 200, 60)) return

  // ── Read body and collect raw string for signature verification ──────────────
  let payload, rawBody
  if (req.body && typeof req.body === 'object') {
    payload = req.body
    // Vercel consumed the stream — re-serialize for signature check (best-effort)
    rawBody = JSON.stringify(req.body)
  } else {
    try {
      rawBody = await new Promise((resolve, reject) => {
        const chunks = []
        req.on('data', c => chunks.push(c))
        req.on('end', () => resolve(Buffer.concat(chunks).toString()))
        req.on('error', reject)
      })
      payload = JSON.parse(rawBody)
    } catch {
      return res.status(400).json({ error: 'Invalid payload' })
    }
  }

  // ── Signature verification ────────────────────────────────────────────────────
  const webhookSecret    = process.env.POLAR_WEBHOOK_SECRET
  const webhookId        = req.headers['webhook-id']
  const webhookTimestamp = req.headers['webhook-timestamp']
  const webhookSig       = req.headers['webhook-signature']

  if (webhookSecret) {
    if (!webhookId || !webhookTimestamp || !webhookSig) {
      console.warn('[webhook] missing signature headers — rejecting')
      return res.status(401).json({ error: 'Missing webhook signature headers' })
    }

    // Reject events older than 5 minutes (prevents replay attacks)
    const age = Math.abs(Date.now() / 1000 - parseInt(webhookTimestamp, 10))
    if (age > 300) {
      console.warn('[webhook] stale timestamp, rejecting')
      return res.status(401).json({ error: 'Webhook timestamp too old' })
    }

    if (!verifySignature(webhookId, webhookTimestamp, rawBody, webhookSig, webhookSecret)) {
      console.warn('[webhook] invalid signature — rejecting')
      return res.status(401).json({ error: 'Invalid webhook signature' })
    }
  } else {
    console.warn('[webhook] POLAR_WEBHOOK_SECRET not set — skipping signature check')
  }

  // ── Process event ─────────────────────────────────────────────────────────────
  const { type, data } = payload || {}
  console.log('[webhook] event:', type, '| email:', data?.customer?.email, '| meta_user_id:', data?.metadata?.user_id)

  // Identify the user: prefer metadata.user_id, fall back to email lookup
  let userId = data?.metadata?.user_id
  if (!userId) userId = await findUserByEmail(data?.customer?.email)

  if (!userId) {
    console.log('[webhook] no user found, ignoring')
    return res.json({ received: true })
  }

  try {
    if (type === 'subscription.created' || type === 'subscription.updated') {
      const plan = data?.status === 'active' ? 'pro' : 'free'
      await updatePlan(userId, plan)
      console.log('[webhook] set', userId, '->', plan)
    } else if (type === 'subscription.canceled') {
      // cancel_at_period_end = user canceled but period hasn't ended yet — keep pro
      const periodEnd = data?.current_period_end ? new Date(data.current_period_end) : null
      const stillActive = data?.cancel_at_period_end && periodEnd && periodEnd > new Date()
      if (!stillActive) {
        await updatePlan(userId, 'free')
        console.log('[webhook] canceled, removed pro for', userId)
      } else {
        console.log('[webhook] canceled at period end, keeping pro until', periodEnd)
      }
    } else if (type === 'subscription.revoked') {
      await updatePlan(userId, 'free')
      console.log('[webhook] revoked pro for', userId)
    }
    res.json({ received: true })
  } catch (err) {
    console.error('[webhook] error:', err)
    res.status(500).json({ error: err.message })
  }
}
