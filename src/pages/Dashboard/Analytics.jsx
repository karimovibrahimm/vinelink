import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import './Analytics.css'

function Analytics() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [links, setLinks] = useState([])
  const [clicks, setClicks] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(7)
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => { getUser() }, [])

  useEffect(() => {
    if (user) fetchClicks(user.id, period)
  }, [period, user])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)
    await Promise.all([getProfile(user.id), getLinks(user.id), fetchClicks(user.id, 7)])
    setLoading(false)
  }

  const getProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) setProfile(data)
  }

  const getLinks = async (userId) => {
    const { data } = await supabase.from('links').select('*').eq('user_id', userId).order('position', { ascending: true })
    if (data) setLinks(data)
  }

  const fetchClicks = async (userId, p) => {
    const from = new Date()
    from.setDate(from.getDate() - p)
    const { data } = await supabase
      .from('link_clicks').select('*').eq('user_id', userId)
      .gte('clicked_at', from.toISOString()).order('clicked_at', { ascending: true })
    if (data) setClicks(data)
  }

  const handlePeriod = (p) => {
    if (p === period) return
    setTransitioning(true)
    setTimeout(() => {
      setPeriod(p)
      setTransitioning(false)
    }, 150)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const chartData = useMemo(() => {
    const days = []
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const label = d.toLocaleDateString('en-US', { weekday: 'short' })
      const count = clicks.filter(c => c.clicked_at.startsWith(dateStr)).length
      days.push({ dateStr, label, count })
    }
    return days
  }, [clicks, period])

  const linkStats = useMemo(() =>
    links.map(link => ({
      ...link,
      clicks: clicks.filter(c => c.link_id === link.id).length
    })).sort((a, b) => b.clicks - a.clicks)
  , [links, clicks])

  const maxVal = Math.max(...chartData.map(d => d.count), 1)
  const totalClicks = clicks.length

  if (loading) return (
    <div className="dashboard__loading">
      <div className="dashboard__spinner"></div>
      <p>Loading...</p>
    </div>
  )

  return (
    <div className="dashboard">

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
          <a href="/dashboard/blocks" className="dashboard__nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="8" height="8" rx="1"/>
              <rect x="13" y="3" width="8" height="8" rx="1"/>
              <rect x="3" y="13" width="8" height="8" rx="1"/>
              <path d="M17 13v2m0 4v2m-2-4h2m2 0h2" strokeLinecap="round"/>
            </svg>
            Blocks
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
          <a href="/dashboard/subscribers" className="dashboard__nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Subscribers
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
            <div className="dashboard__profile-avatar">{profile?.username?.[0]?.toUpperCase() || 'U'}</div>
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

      <main className="dashboard__main">
        <div className="dashboard__header">
          <div>
            <h1 className="dashboard__title">Analytics</h1>
            <p className="dashboard__subtitle">Real click data from your Vinelink page</p>
            <p className="analytics__mobile-note">
              For a more detailed analytics experience, view Vinelink on desktop.
            </p>
          </div>
          <div className="analytics__period">
            {[7, 30, 90].map(p => (
              <button
                key={p}
                className={`analytics__period-btn ${period === p ? 'analytics__period-btn--active' : ''}`}
                onClick={() => handlePeriod(p)}
              >
                {p === 90 ? 'All time' : `${p} days`}
              </button>
            ))}
          </div>
        </div>

        <div className="analytics__stats">
          <div className="analytics__stat-card">
            <div className="analytics__stat-icon">🔗</div>
            <div className="analytics__stat-value">{totalClicks}</div>
            <div className="analytics__stat-label">Total Clicks</div>
            <div className="analytics__stat-change analytics__stat-change--up">Last {period} days</div>
          </div>
          <div className="analytics__stat-card">
            <div className="analytics__stat-icon">📊</div>
            <div className="analytics__stat-value">{(totalClicks / period).toFixed(1)}</div>
            <div className="analytics__stat-label">Avg Clicks / Day</div>
            <div className="analytics__stat-change analytics__stat-change--up">Last {period} days</div>
          </div>
          <div className="analytics__stat-card">
            <div className="analytics__stat-icon">🏆</div>
            <div className="analytics__stat-value">{linkStats[0]?.clicks || 0}</div>
            <div className="analytics__stat-label">Top Link Clicks</div>
            <div className="analytics__stat-change analytics__stat-change--up">{linkStats[0]?.title || 'No links yet'}</div>
          </div>
          <div className="analytics__stat-card">
            <div className="analytics__stat-icon">🔗</div>
            <div className="analytics__stat-value">{links.length}</div>
            <div className="analytics__stat-label">Active Links</div>
            <div className="analytics__stat-change analytics__stat-change--up">On your page</div>
          </div>
        </div>

        <div className="analytics__chart-card">
          <div className="analytics__chart-header">
            <h2 className="analytics__chart-title">Clicks — Last {period} Days</h2>
            <div className="analytics__chart-total">{totalClicks} total</div>
          </div>
          {totalClicks === 0 ? (
            <div className="analytics__no-data">
              <p>🌿 No clicks yet. Share your Vinelink page to start tracking!</p>
            </div>
          ) : (
            <div
              className={`analytics__chart ${
                period === 90 ? 'analytics__chart--scroll' : ''
              } ${transitioning ? 'analytics__chart--hidden' : ''}`}
            >
              {chartData.map((day, i) => (
                <div className="analytics__bar-col" key={day.dateStr}>

                  <div className="analytics__bar-tooltip">
                    <span>
                      {new Date(day.dateStr).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <strong>{day.count} clicks</strong>
                  </div>

                  {day.count > 0 && (
                    <div className="analytics__bar-value">
                      {period === 90
                        ? day.count >= maxVal * 0.35
                          ? day.count
                          : ''
                        : day.count}
                    </div>
                  )}

                  <div className="analytics__bar-wrap">
                    <div
                      className="analytics__bar"
                      style={{
                        height: `${(day.count / maxVal) * 100}%`
                      }}
                    />
                  </div>

                  <div className="analytics__bar-label">
                    {period === 7
                      ? day.label
                      : period === 30
                      ? i % 5 === 0
                        ? day.label
                        : ''
                      : i % 15 === 0
                      ? day.label
                      : ''}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        <div className="analytics__links-card">
          <h2 className="analytics__chart-title" style={{ marginBottom: '20px' }}>Top Links</h2>
          {linkStats.length === 0 ? (
            <p className="analytics__empty">Add links to start tracking clicks.</p>
          ) : (
            <div className="analytics__link-list">
              {linkStats.map((link, i) => (
                <div className="analytics__link-row" key={link.id}>
                  <div className="analytics__link-rank">{i + 1}</div>
                  <div className="analytics__link-details">
                    <div className="analytics__link-title">{link.title}</div>
                    <div className="analytics__link-bar-wrap">
                      <div className="analytics__link-bar" style={{ width: `${linkStats[0].clicks > 0 ? (link.clicks / linkStats[0].clicks) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div className="analytics__link-clicks">{link.clicks} {link.clicks === 1 ? 'click' : 'clicks'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <nav className="dashboard__mobile-nav">
        <a href="/dashboard" className="dashboard__mobile-nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>Links</span>
        </a>
        <a href="/dashboard/blocks" className="dashboard__mobile-nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="8" height="8" rx="1"/>
            <rect x="13" y="3" width="8" height="8" rx="1"/>
            <rect x="3" y="13" width="8" height="8" rx="1"/>
            <path d="M17 13v2m0 4v2m-2-4h2m2 0h2"/>
          </svg>
          <span>Blocks</span>
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
        <a href="/dashboard/subscribers" className="dashboard__mobile-nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>Subs</span>
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

export default Analytics;