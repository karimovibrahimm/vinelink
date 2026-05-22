const https = require('https')

function post(url, body, headers) {
  return new Promise((resolve, reject) => {
    const u        = new URL(url)
    const payload  = JSON.stringify(body)
    const options  = {
      hostname: u.hostname,
      path:     u.pathname + u.search,
      method:   'POST',
      headers:  { ...headers, 'Content-Length': Buffer.byteLength(payload) },
    }
    const req = https.request(options, (res) => {
      let raw = ''
      res.on('data', c => raw += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }) }
        catch { resolve({ status: res.statusCode, body: raw }) }
      })
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId, email } = req.body || {}
  if (!userId || !email) {
    return res.status(400).json({ error: 'Missing userId or email' })
  }

  if (!process.env.POLAR_ACCESS_TOKEN || !process.env.POLAR_PRICE_ID) {
    return res.status(500).json({ error: 'Polar env vars not configured (POLAR_ACCESS_TOKEN / POLAR_PRICE_ID)' })
  }

  try {
    const { status, body } = await post(
      'https://api.polar.sh/v1/checkouts/custom',
      {
        product_price_id: process.env.POLAR_PRICE_ID,
        success_url: `${process.env.VITE_SITE_URL}/dashboard?upgraded=1`,
        customer_email: email,
        metadata: { user_id: userId },
      },
      {
        Authorization:  `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      }
    )

    if (status >= 400) {
      const detail = typeof body === 'object' ? (body.detail || JSON.stringify(body)) : body
      return res.status(400).json({ error: `Polar error: ${detail}` })
    }

    res.json({ url: body.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
