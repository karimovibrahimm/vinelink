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
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<><Navbar /><Landing /></>} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/appearance" element={<Appearance />} />
          <Route path="/dashboard/analytics" element={<Analytics />} />
          <Route path="/:username" element={<Profile />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App