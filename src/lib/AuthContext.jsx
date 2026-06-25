import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

// Wraps all /dashboard/* routes. Fetches the user + profile once and keeps
// them in memory across page navigation, instead of every page re-fetching
// from scratch on mount (which caused the full reload + "Upgrade" flash).
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // null = not fetched yet (so pages know to fetch), array = cached and shared
  // across every dashboard page for the rest of the session.
  const [links, setLinks] = useState(null)
  const [blocks, setBlocks] = useState(null)

  const refreshProfile = useCallback(async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) setProfile(data)
    return data
  }, [])

  const refreshLinks = useCallback(async (userId) => {
    const { data } = await supabase.from('links').select('*').eq('user_id', userId).order('position', { ascending: true })
    if (data) setLinks(data)
    return data
  }, [])

  const refreshBlocks = useCallback(async (userId) => {
    const { data } = await supabase.from('blocks').select('*').eq('user_id', userId).order('position', { ascending: true })
    if (data) setBlocks(data)
    return data
  }, [])

  useEffect(() => {
    let active = true
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!active) return
      if (!authUser) { window.location.href = '/login'; return }
      setUser(authUser)
      const prof = await refreshProfile(authUser.id)
      if (!active) return
      if (prof && !prof.onboarding_done) { window.location.href = '/onboarding'; return }
      setAuthLoading(false)
    }
    init()
    return () => { active = false }
  }, [refreshProfile])

  const value = {
    user,
    profile,
    authLoading,
    setProfile,
    refreshProfile: () => user && refreshProfile(user.id),
    links,
    setLinks,
    refreshLinks: () => user && refreshLinks(user.id),
    blocks,
    setBlocks,
    refreshBlocks: () => user && refreshBlocks(user.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
