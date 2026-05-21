import { useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const handled = useRef(false)

  useEffect(() => {
    const redirect = async (session) => {
      if (handled.current) return
      handled.current = true

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_done')
        .eq('id', session.user.id)
        .single()

      window.location.href = (!profile || !profile.onboarding_done)
        ? '/onboarding'
        : '/dashboard'
    }

    // Primary: fires when OAuth code exchange completes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) redirect(session)
    })

    // Fallback: already has a session (e.g. page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) redirect(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="dashboard__loading">
      <div className="dashboard__spinner" />
      <p>Signing you in…</p>
    </div>
  )
}
