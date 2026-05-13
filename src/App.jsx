import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import Landing from './pages/Landing/Landing'
import Signup from './pages/Auth/Signup'
import Login from './pages/Auth/Login'
import ForgotPassword from './pages/Auth/ForgotPassword'
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
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<><Navbar /><Landing /></>} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
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