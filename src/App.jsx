import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import Landing from './pages/Landing/Landing'
import Signup from './pages/Auth/Signup'
import Login from './pages/Auth/Login'
import ForgotPassword from './pages/Auth/ForgotPassword'
import AuthCallback from './pages/Auth/AuthCallback'
import Dashboard from './pages/Dashboard/Dashboard'
import Appearance from './pages/Dashboard/Appearance'
import Analytics from './pages/Dashboard/Analytics'
import Profile from './pages/Profile/Profile'
import Onboarding from './pages/Onboarding/Onboarding'
import Settings from './pages/Dashboard/Settings'
import Blocks from './pages/Blocks/Block'
import Subscribers from './pages/Subscribers/Subscribers'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

function OnboardingWrapper() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const get = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setLoading(false)
    }
    get()
  }, [])

  if (loading) return (
    <div className="dashboard__loading">
      <div className="dashboard__spinner"></div>
    </div>
  )

  return (
    <Onboarding
      user={user}
      profile={profile}
      onComplete={() => window.location.href = '/dashboard'}
    />
  )
}

function App() {
  const [subdomain, setSubdomain] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const host = window.location.hostname
    const parts = host.split('.')
    
    // Check if there is a subdomain (e.g., ibrahim.vinelink.xyz has 3 parts)
    // We ignore 'www' so the main landing page still works.
    if (parts.length >= 3 && parts[0] !== 'www') {
      setSubdomain(parts[0])
    }
    setChecking(false)
  }, [])

  if (checking) return null

  // THE HIJACK: If a subdomain exists, ONLY render the Profile.
  // We pass it as a custom prop so Profile knows who to look for.
  if (subdomain) {
    return <Profile customUsername={subdomain} />
  }

  // Otherwise, render the standard application routing.
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<><Navbar /><Landing /></>} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/onboarding" element={<OnboardingWrapper />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/appearance" element={<Appearance />} />
          <Route path="/dashboard/analytics" element={<Analytics />} />
          <Route path="/dashboard/settings" element={<Settings />} />
          <Route path="/dashboard/blocks" element={<Blocks />} />
          <Route path="/dashboard/subscribers" element={<Subscribers />} />
          <Route path="/:username" element={<Profile />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App;