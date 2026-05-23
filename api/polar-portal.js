const { createClient } = require('@supabase/supabase-js')

module.exports = async (req, res) => {
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

  try {
    const response = await fetch('https://api.polar.sh/v1/customer-sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customer_email: user.email }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(500).json({ error: data.detail || 'Failed to create portal session' })

    res.json({ url: data.customer_portal_url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
