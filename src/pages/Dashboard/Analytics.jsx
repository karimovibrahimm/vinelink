import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import './Analytics.css'

function Analytics() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)
    await getProfile(user.id)
    await getLinks(user.id)
    setLoading(false)
  }

  const getProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setProfile(data)
  }

  const getLinks = async (userId) => {
    const { data } = await supabase
      .from('links')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })
    if (data) setLinks(data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // Mock analytics data — replace with real data later
  const stats = [
    { label: 'Total Views', value: '1,284', change: '+12%', positive: true, icon: '👁️' },
    { label: 'Total Clicks', value: '342', change: '+8%', positive: true, icon: '🔗' },
    { label: 'Click Rate', value: '26.6%', change: '+2%', positive: true, icon: '📈' },
    { label: 'New Followers', value: '48', change: '-3%', positive: false, icon: '👥' },
  ]

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weekData = [42, 68, 55, 89, 73, 110, 95]
  const maxVal = Math.max(...weekData)

  if (loading) {
    return (
      <div className="dashboard__loading">
        <div className="dashboard__spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">

      {/* Sidebar */}
      <aside className="dashboard__sidebar">
        <a href="/" className="dashboard__logo">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <path d="M14 4 C14 4 8 8 8 14 C8 18 10 21 14 24 C18 21 20 18 20 14 C20 8 14 4 14 4Z" fill="#c9a84c"/>
            <path d="M14 24 C14 24 10 20 8 16 C10 17 13 17 14 24Z" fill="#1a3a2a"/>
            <path d="M14 24 C14 24 18 20 20 16 C18 17 15 17 14 24Z" fill="#1a3a2a"/>
            <line x1="14" y1="24" x2="14" y2="28" stroke="#1a3a2a" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Vinelink
        </a>
        <nav className="dashboard__nav">
          <a href="/dashboard" className="dashboard__nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Links
          </a>
          <a href="/dashboard/appearance" className="dashboard__nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            Appearance
          </a>
          <a href="/dashboard/analytics" className="dashboard__nav-item dashboard__nav-item--active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Analytics
          </a>
          <a href="/dashboard/settings" className="dashboard__nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Settings
          </a>
        </nav>
        <div className="dashboard__sidebar-bottom">
          <div className="dashboard__profile-pill">
            <div className="dashboard__profile-avatar">
              {profile?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="dashboard__profile-info">
              <div className="dashboard__profile-name">@{profile?.username}</div>
              <div className="dashboard__profile-plan">Free plan</div>
            </div>
          </div>
          <button className="dashboard__logout" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="dashboard__main">

        <div className="dashboard__header">
          <div>
            <h1 className="dashboard__title">Analytics</h1>
            <p className="dashboard__subtitle">Track your page performance</p>
          </div>
          <div className="analytics__period">
            <button className="analytics__period-btn analytics__period-btn--active">7 days</button>
            <button className="analytics__period-btn">30 days</button>
            <button className="analytics__period-btn">All time</button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="analytics__stats">
          {stats.map((stat, i) => (
            <div className="analytics__stat-card" key={i}>
              <div className="analytics__stat-icon">{stat.icon}</div>
              <div className="analytics__stat-value">{stat.value}</div>
              <div className="analytics__stat-label">{stat.label}</div>
              <div className={`analytics__stat-change ${stat.positive ? 'analytics__stat-change--up' : 'analytics__stat-change--down'}`}>
                {stat.positive ? '↑' : '↓'} {stat.change} vs last week
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="analytics__chart-card">
          <div className="analytics__chart-header">
            <h2 className="analytics__chart-title">Page Views — Last 7 Days</h2>
            <div className="analytics__chart-total">532 total</div>
          </div>
          <div className="analytics__chart">
            {weekData.map((val, i) => (
              <div className="analytics__bar-col" key={i}>
                <div className="analytics__bar-value">{val}</div>
                <div className="analytics__bar-wrap">
                  <div
                    className="analytics__bar"
                    style={{ height: `${(val / maxVal) * 100}%` }}
                  ></div>
                </div>
                <div className="analytics__bar-label">{weekDays[i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Links */}
        <div className="analytics__links-card">
          <h2 className="analytics__chart-title" style={{ marginBottom: '20px' }}>Top Links</h2>
          {links.length === 0 ? (
            <p className="analytics__empty">Add links to start tracking clicks.</p>
          ) : (
            <div className="analytics__link-list">
              {links.map((link, i) => {
                const mockClicks = Math.floor(Math.random() * 120) + 10
                const maxClicks = 130
                return (
                  <div className="analytics__link-row" key={link.id}>
                    <div className="analytics__link-rank">{i + 1}</div>
                    <div className="analytics__link-details">
                      <div className="analytics__link-title">{link.title}</div>
                      <div className="analytics__link-bar-wrap">
                        <div
                          className="analytics__link-bar"
                          style={{ width: `${(mockClicks / maxClicks) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="analytics__link-clicks">{mockClicks} clicks</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Upgrade banner */}
        <div className="analytics__upgrade">
          <div className="analytics__upgrade-text">
            <div className="analytics__upgrade-title">🚀 Unlock full analytics</div>
            <div className="analytics__upgrade-sub">Get real click tracking, traffic sources, and more with Pro.</div>
          </div>
          <a href="/dashboard/settings" className="analytics__upgrade-btn">Upgrade to Pro</a>
        </div>

      </main>

      {/* Mobile Bottom Nav */}
      <nav className="dashboard__mobile-nav">
        <a href="/dashboard" className="dashboard__mobile-nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>Links</span>
        </a>
        <a href="/dashboard/appearance" className="dashboard__mobile-nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span>Appearance</span>
        </a>
        <a href="/dashboard/analytics" className="dashboard__mobile-nav-item dashboard__mobile-nav-item--active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <span>Analytics</span>
        </a>
        <a href="/dashboard/settings" className="dashboard__mobile-nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span>Settings</span>
        </a>
      </nav>

    </div>
  )
}

export default Analytics