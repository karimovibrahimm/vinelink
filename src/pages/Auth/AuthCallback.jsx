import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'

async function redirectUser(session) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_done')
    .eq('id', session.user.id)
    .single()

  window.location.href = (!profile || !profile.onboarding_done)
    ? '/onboarding'
    : '/dashboard'
}

export default function AuthCallback() {
  useEffect(() => {
    const handle = async () => {
      try {
        // PKCE flow: code in query string
        const code = new URLSearchParams(window.location.search).get('code')
        if (code) {
          const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
          if (session) { await redirectUser(session); return }
          if (error) { window.location.href = '/login'; return }
        }

        // Implicit flow: tokens arrive via hash (handled automatically by getSession)
        const { data: { session } } = await supabase.auth.getSession()
        if (session) { await redirectUser(session); return }

        window.location.href = '/login'
      } catch {
        window.location.href = '/login'
      }
    }

    handle()
  }, [])

  return (
    <div className="dashboard__loading">
      <div className="dashboard__spinner" />
      <p>Signing you in…</p>
    </div>
  )
}
