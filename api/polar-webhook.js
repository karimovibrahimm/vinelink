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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Vercel auto-parses JSON bodies — handle both parsed object and raw stream
  let payload
  if (req.body && typeof req.body === 'object') {
    payload = req.body
  } else {
    try {
      const raw = await new Promise((resolve, reject) => {
        const chunks = []
        req.on('data', c => chunks.push(c))
        req.on('end', () => resolve(Buffer.concat(chunks).toString()))
        req.on('error', reject)
      })
      payload = JSON.parse(raw)
    } catch {
      return res.status(400).json({ error: 'Invalid payload' })
    }
  }

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
    } else if (type === 'subscription.canceled' || type === 'subscription.revoked') {
      await updatePlan(userId, 'free')
      console.log('[webhook] revoked pro for', userId)
    }
    res.json({ received: true })
  } catch (err) {
    console.error('[webhook] error:', err)
    res.status(500).json({ error: err.message })
  }
}
