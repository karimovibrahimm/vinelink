import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import '../../pages/Dashboard/Dashboard.css'

const NAV_ITEMS = [
  {
    id: 'links', href: '/dashboard', label: 'Links', mobileLabel: 'Links',
    icon: s => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  },
  {
    id: 'blocks', href: '/dashboard/blocks', label: 'Blocks', mobileLabel: 'Blocks',
    icon: s => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><path d="M17 13v2m0 4v2m-2-4h2m2 0h2" strokeLinecap="round"/></svg>,
  },
  {
    id: 'appearance', href: '/dashboard/appearance', label: 'Appearance', mobileLabel: 'Appearance',
    icon: s => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  },
  {
    id: 'subscribers', href: '/dashboard/subscribers', label: 'Subscribers', mobileLabel: 'Subs',
    icon: s => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    id: 'analytics', href: '/dashboard/analytics', label: 'Analytics', mobileLabel: 'Analytics',
    icon: s => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
  {
    id: 'settings', href: '/dashboard/settings', label: 'Settings', mobileLabel: 'Settings',
    icon: s => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  },
]

const logout = async () => {
  await supabase.auth.signOut()
  window.location.href = '/'
}

async function startCheckout(profile) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const res = await fetch('/api/polar/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, email: user.email }),
    })
    const { url, error } = await res.json()
    if (error) { alert(error); return }
    window.location.href = url
  } catch {
    alert('Could not start checkout. Please try again.')
  }
}

export default function DashboardLayout({ activePage, profile, children }) {
  const [upgrading, setUpgrading] = useState(false)
  const isPro = profile?.plan === 'pro'

  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const res  = await fetch('/api/polar/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      })
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch {
        alert(`Server error (${res.status}): ${text.slice(0, 200)}`)
        setUpgrading(false)
        return
      }
      if (data.error) { alert(data.error); setUpgrading(false); return }
      window.location.href = data.url
    } catch (err) {
      alert(`Checkout failed: ${err.message}`)
    }
    setUpgrading(false)
  }

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
          {NAV_ITEMS.map(item => (
            <a
              key={item.id}
              href={item.href}
              className={`dashboard__nav-item${activePage === item.id ? ' dashboard__nav-item--active' : ''}`}
            >
              {item.icon(18)}
              {item.label}
            </a>
          ))}
        </nav>
        <div className="dashboard__sidebar-bottom">
          <div className="dashboard__profile-pill">
            <div className="dashboard__profile-avatar">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" />
                : profile?.username?.[0]?.toUpperCase() || 'U'
              }
            </div>
            <div className="dashboard__profile-info">
              <div className="dashboard__profile-name">
                {profile?.username ? `@${profile.username}` : '—'}
              </div>
              <div className={`dashboard__profile-plan${isPro ? ' dashboard__profile-plan--pro' : ''}`}>
                {isPro ? '⚡ Pro' : 'Free plan'}
              </div>
            </div>
          </div>
          {!isPro && (
            <button className="dashboard__upgrade-btn" onClick={handleUpgrade} disabled={upgrading}>
              {upgrading ? 'Loading…' : '⚡ Upgrade to Pro'}
            </button>
          )}
          <button className="dashboard__logout" onClick={logout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log out
          </button>
        </div>
      </aside>

      {children}

      <nav className="dashboard__mobile-nav">
        {NAV_ITEMS.map(item => (
          <a
            key={item.id}
            href={item.href}
            className={`dashboard__mobile-nav-item${activePage === item.id ? ' dashboard__mobile-nav-item--active' : ''}`}
          >
            {item.icon(20)}
            <span>{item.mobileLabel}</span>
          </a>
        ))}
      </nav>

    </div>
  )
}
