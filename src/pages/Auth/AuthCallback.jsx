import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  useEffect(() => {
    const handle = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, onboarding_done')
        .eq('id', session.user.id)
        .single()

      if (!profile || !profile.onboarding_done) {
        window.location.href = '/onboarding'
      } else {
        window.location.href = '/dashboard'
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
