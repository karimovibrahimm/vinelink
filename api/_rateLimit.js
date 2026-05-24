export async function rateLimit(req, res, endpoint, max = 5, windowSeconds = 900) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  const key = `${endpoint}:${ip}`

  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/check_rate_limit`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_key: key, p_max: max, p_window_seconds: windowSeconds }),
    })

    const allowed = await response.json()
    if (!allowed) {
      res.status(429).json({ error: 'Too many requests. Please try again in 15 minutes.' })
      return false
    }
    return true
  } catch {
    return true // fail open — don't block users if rate limit check errors
  }
}
