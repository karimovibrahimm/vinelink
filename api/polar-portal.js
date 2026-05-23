import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' })

  const headers = {
    Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  }

  try {
    const customerRes = await fetch(
      `https://api.polar.sh/v1/customers?email=${encodeURIComponent(user.email)}&limit=1`,
      { headers }
    )
    const customerData = await customerRes.json()
    const customer = customerData?.items?.[0] || customerData?.result?.items?.[0]

    if (!customer?.id) {
      return res.status(404).json({ error: 'No Polar customer found. Make sure you have an active subscription.' })
    }

    const sessionRes = await fetch('https://api.polar.sh/v1/customer-sessions', {
      method: 'POST',
      headers,
      body: JSON.stringify({ customer_id: customer.id }),
    })
    const sessionData = await sessionRes.json()

    if (!sessionRes.ok) {
      const detail = Array.isArray(sessionData.detail)
        ? JSON.stringify(sessionData.detail)
        : (sessionData.detail || sessionData.message || JSON.stringify(sessionData))
      return res.status(500).json({ error: `Polar ${sessionRes.status}: ${detail}` })
    }

    const url = sessionData.customer_portal_url || sessionData.url
    if (!url) return res.status(500).json({ error: `Polar returned: ${JSON.stringify(sessionData)}` })

    res.json({ url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
