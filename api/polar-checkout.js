module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') return res.status(405).end('{}')

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
    const { userId, email } = body

    if (!process.env.POLAR_ACCESS_TOKEN) return res.status(500).json({ error: 'POLAR_ACCESS_TOKEN not set' })
    if (!process.env.POLAR_PRICE_ID)     return res.status(500).json({ error: 'POLAR_PRICE_ID not set' })
    if (!userId || !email)               return res.status(400).json({ error: 'Missing userId or email' })

    const response = await fetch('https://api.polar.sh/v1/checkouts/custom', {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_price_id: process.env.POLAR_PRICE_ID,
        success_url: `${process.env.VITE_SITE_URL || 'https://vinelink.xyz'}/dashboard?upgraded=1`,
        customer_email: email,
        metadata: { user_id: userId },
      }),
    })

    const text = await response.text()
    let data
    try { data = JSON.parse(text) } catch { return res.status(500).json({ error: `Polar non-JSON: ${text.slice(0, 200)}` }) }

    if (!response.ok) {
      const detail = Array.isArray(data.detail)
        ? JSON.stringify(data.detail)
        : (data.detail || data.message || JSON.stringify(data))
      return res.status(400).json({ error: `Polar ${response.status}: ${detail}` })
    }

    return res.status(200).json({ url: data.url })
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) })
  }
}
