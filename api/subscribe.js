import { createClient } from '@supabase/supabase-js'
import { rateLimit } from './_rateLimit.js'

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,253}$/
const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // 5 subscription attempts per IP per 15 minutes
  if (!await rateLimit(req, res, 'subscribe', 5, 900)) return

  const { blockId, userId, email } = req.body || {}

  if (!blockId || !userId || !email)
    return res.status(400).json({ error: 'Missing fields.' })
  if (!UUID_RE.test(blockId) || !UUID_RE.test(userId))
    return res.status(400).json({ error: 'Invalid IDs.' })

  const trimmed = String(email).trim()
  if (!EMAIL_RE.test(trimmed) || trimmed.length > 254)
    return res.status(400).json({ error: 'Invalid email address.' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Verify the block exists, is active, and belongs to the claimed userId
  const { data: block } = await supabase
    .from('blocks')
    .select('id')
    .eq('id', blockId)
    .eq('user_id', userId)
    .eq('type', 'newsletter')
    .eq('active', true)
    .single()

  if (!block) return res.status(404).json({ error: 'Newsletter not found.' })

  // Cap at 10,000 subscribers per block to prevent billing abuse
  const { count } = await supabase
    .from('newsletter_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('block_id', blockId)

  if (count >= 10000)
    return res.status(400).json({ error: 'This newsletter is not accepting new subscribers.' })

  // Upsert — silently succeed if already subscribed (no duplicate error to caller)
  const { error } = await supabase
    .from('newsletter_subscribers')
    .upsert(
      { block_id: blockId, user_id: userId, email: trimmed },
      { onConflict: 'block_id,email', ignoreDuplicates: true }
    )

  if (error) return res.status(500).json({ error: 'Could not subscribe. Please try again.' })

  res.json({ ok: true })
}
