module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId, email } = req.body || {}

  if (!process.env.POLAR_ACCESS_TOKEN || !process.env.POLAR_PRICE_ID) {
    return res.status(500).json({ error: 'Missing POLAR_ACCESS_TOKEN or POLAR_PRICE_ID in Vercel env vars' })
  }

  if (!userId || !email) {
    return res.status(400).json({ error: 'Missing userId or email' })
  }

  try {
    const response = await fetch('https://api.polar.sh/v1/checkouts/custom', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_price_id: process.env.POLAR_PRICE_ID,
        success_url: `${process.env.VITE_SITE_URL || 'https://vinelink.xyz'}/dashboard?upgraded=1`,
        customer_email: email,
        metadata: { user_id: userId },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const detail = Array.isArray(data.detail)
        ? JSON.stringify(data.detail)
        : (data.detail || data.message || JSON.stringify(data))
      return res.status(400).json({ error: `Polar: ${detail}` })
    }

    res.json({ url: data.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
