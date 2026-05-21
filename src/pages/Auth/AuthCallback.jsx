import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  useEffect(() => {
    const handle = async () => {
      try {
        // Explicitly exchange the code — this is what Supabase PKCE flow needs
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')

        if (code) {
          const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error || !session) { window.location.href = '/login'; return }
          await redirectUser(session)
          return
        }

        // Fallback for hash-based (implicit) flow
        const { data: { session } } = await supabase.auth.getSession()
        if (session) { await redirectUser(session); return }

        window.location.href = '/login'
      } catch {
        window.location.href = '/login'
      }
    }

    handle()
  }, [])

  const redirectUser = async (session) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_done')
      .eq('id', session.user.id)
      .single()

    window.location.href = (!profile || !profile.onboarding_done)
      ? '/onboarding'
      : '/dashboard'
  }

  return (
    <div className="dashboard__loading">
      <div className="dashboard__spinner" />
      <p>Signing you in…</p>
    </div>
  )
}
