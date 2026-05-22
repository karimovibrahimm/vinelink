module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId, email } = req.body
  if (!userId || !email) return res.status(400).json({ error: 'Missing userId or email' })

  try {
    const response = await fetch('https://api.polar.sh/v1/checkouts/custom', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_price_id: process.env.POLAR_PRICE_ID,
        success_url: `${process.env.VITE_SITE_URL}/dashboard?upgraded=1`,
        customer_email: email,
        metadata: { user_id: userId },
      }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(400).json({ error: data.detail || 'Checkout failed' })

    res.json({ url: data.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
