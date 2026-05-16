import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout'
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
    setTimeout(() => { setPeriod(p); setTransitioning(false) }, 150)
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
    <DashboardLayout activePage="analytics" profile={profile}>

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
            <div className={`analytics__chart ${period === 90 ? 'analytics__chart--scroll' : ''} ${transitioning ? 'analytics__chart--hidden' : ''}`}>
              {chartData.map((day, i) => (
                <div className="analytics__bar-col" key={day.dateStr}>
                  <div className="analytics__bar-tooltip">
                    <span>{new Date(day.dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <strong>{day.count} clicks</strong>
                  </div>
                  {day.count > 0 && (
                    <div className="analytics__bar-value">
                      {period === 90 ? day.count >= maxVal * 0.35 ? day.count : '' : day.count}
                    </div>
                  )}
                  <div className="analytics__bar-wrap">
                    <div className="analytics__bar" style={{ height: `${(day.count / maxVal) * 100}%` }} />
                  </div>
                  <div className="analytics__bar-label">
                    {period === 7 ? day.label : period === 30 ? i % 5 === 0 ? day.label : '' : i % 15 === 0 ? day.label : ''}
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

    </DashboardLayout>
  )
}

export default Analytics;
