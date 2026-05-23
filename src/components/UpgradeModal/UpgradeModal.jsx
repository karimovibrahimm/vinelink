import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import './UpgradeModal.css'

function UpgradeModal({ title, message, onClose }) {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const res = await fetch('/api/polar-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        console.error('Checkout error:', json.error)
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="upgrade-modal__overlay" onClick={onClose}>
      <div className="upgrade-modal__card" onClick={e => e.stopPropagation()}>
        <button className="upgrade-modal__close" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="upgrade-modal__icon">⚡</div>
        <h2 className="upgrade-modal__title">{title}</h2>
        <p className="upgrade-modal__message">{message}</p>

        <ul className="upgrade-modal__perks">
          <li>Unlimited links &amp; blocks</li>
          <li>Unlimited newsletter sends</li>
          <li>All premium themes</li>
          <li>Advanced analytics (30 &amp; 90 days)</li>
          <li>Priority support</li>
        </ul>

        <button className="upgrade-modal__cta" onClick={handleUpgrade} disabled={loading}>
          {loading ? 'Loading…' : '⚡ Upgrade to Pro — $4/mo'}
        </button>
        <button className="upgrade-modal__skip" onClick={onClose}>Maybe later</button>
      </div>
    </div>
  )
}

export default UpgradeModal
