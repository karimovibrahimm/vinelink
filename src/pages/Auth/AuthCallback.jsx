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

    // onAuthStateChange fires once Supabase finishes processing
    // the hash tokens — this is the reliable way to catch the session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (done) return
        if (event === 'SIGNED_IN' && session) {
          done = true
          subscription.unsubscribe()
          await redirectUser(session)
        }
      }
    )

    // Also handle PKCE code flow and already-existing sessions
    const init = async () => {
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)
        if (session && !done) {
          done = true
          subscription.unsubscribe()
          await redirectUser(session)
          return
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session && !done) {
        done = true
        subscription.unsubscribe()
        await redirectUser(session)
      }
    }

    init()

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="dashboard__loading">
      <div className="dashboard__spinner" />
      <p>Signing you in…</p>
    </div>
  )
}
