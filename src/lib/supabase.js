import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error(
    `Supabase env vars not loaded.\n` +
    `VITE_SUPABASE_URL: ${url ?? 'MISSING'}\n` +
    `VITE_SUPABASE_ANON_KEY: ${key ? 'set' : 'MISSING'}\n\n` +
    `Fix: restart the dev server after editing .env`
  )
}

export const supabase = createClient(url, key)
