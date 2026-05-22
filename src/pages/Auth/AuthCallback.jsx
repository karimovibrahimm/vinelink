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
    let done = false

    const handleEvent = async (event, session) => {
      if (done) return

      // Session present — redirect appropriately
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        done = true
        await redirectUser(session)
        return
      }

      // No session on initial check — try PKCE code exchange
      if (event === 'INITIAL_SESSION' && !session) {
        const code = new URLSearchParams(window.location.search).get('code')
        if (code) {
          done = true
          const { data: { session: s } } = await supabase.auth.exchangeCodeForSession(code)
          if (s) { await redirectUser(s); return }
        }
        window.location.href = '/login'
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleEvent)
    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="dashboard__loading">
      <div className="dashboard__spinner" />
      <p>Signing you in…</p>
    </div>
  )
}
