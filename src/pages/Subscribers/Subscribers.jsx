import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import './Subscribers.css'
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout'
import UpgradeModal from '../../components/UpgradeModal/UpgradeModal'
import usePageMeta from '../../lib/usePageMeta'
import { useToast } from '../../lib/ToastContext'

function ComposePanel({ block, subscriberCount, onClose, onLimitReached, onSent }) {
  const [subject, setSubject] = useState('')
  const [body, setBody]       = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const toast = useToast()

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Please fill in subject and message.')
      return
    }
    setSending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockId: block.id,
          subject,
          body,
          token: session.access_token,
        }),
      })
      const json = await res.json()
      if (res.status === 429) { onLimitReached(); return }
      if (!res.ok) throw new Error(json.error || 'Send failed.')
      setSent(true)
      onSent()
      toast.success(`Sent to ${json.sent} subscriber${json.sent !== 1 ? 's' : ''}!`)
    } catch (err) {
      toast.error(err.message)
    }
    setSending(false)
  }

  if (sent) {
    return (
      <div className="subs__compose subs__compose--sent">
        <div className="subs__compose-sent-icon">✓</div>
        <div className="subs__compose-sent-text">Email sent successfully!</div>
        <button className="subs__compose-close" onClick={onClose}>Close</button>
      </div>
    )
  }

  return (
    <div className="subs__compose">
      <div className="subs__compose-header">
        <div>
          <div className="subs__compose-title">New email</div>
          <div className="subs__compose-meta">
            Sending to <strong>{subscriberCount}</strong> subscriber{subscriberCount !== 1 ? 's' : ''}
          </div>
        </div>
        <button className="subs__compose-close-x" onClick={onClose} title="Discard">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className="subs__compose-fields">
        <input
          className="subs__compose-input"
          type="text"
          placeholder="Subject line..."
          value={subject}
          onChange={e => setSubject(e.target.value)}
          maxLength={120}
        />
        <textarea
          className="subs__compose-body"
          placeholder="Write your message here..."
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={8}
        />
      </div>

      <div className="subs__compose-footer">
        <span className="subs__compose-hint">Plain text — subscribers will receive a clean, formatted email.</span>
        <button
          className="subs__send-btn"
          onClick={handleSend}
          disabled={sending || !subject.trim() || !body.trim()}
        >
          {sending ? 'Sending…' : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Send
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function Subscribers() {
  const [user, setUser]         = useState(null)
  const [profile, setProfile]   = useState(null)
  usePageMeta('Subscribers | Vinelink', 'View and manage your newsletter subscribers on Vinelink.')
  const toast = useToast()

  const [groups, setGroups]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [composingId, setComposingId] = useState(null)
  const [sendsThisMonth, setSendsThisMonth] = useState(0)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (prof) setProfile(prof)
    await Promise.all([fetchData(user.id), fetchSendsThisMonth(user.id)])
    setLoading(false)
  }

  const fetchSendsThisMonth = async (uid) => {
    const start = new Date()
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('newsletter_sends')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid)
      .gte('sent_at', start.toISOString())
    setSendsThisMonth(count || 0)
  }

  const fetchData = async (uid) => {
    const { data: blocks } = await supabase
      .from('blocks')
      .select('*')
      .eq('user_id', uid)
      .eq('type', 'newsletter')
      .order('position', { ascending: true })

    if (!blocks?.length) { setGroups([]); return }

    const { data: subs } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('user_id', uid)
      .order('subscribed_at', { ascending: false })

    setGroups(blocks.map(block => ({
      block,
      subscribers: (subs || []).filter(s => s.block_id === block.id),
    })))
  }

  const handleDelete = async (id) => {
    await supabase.from('newsletter_subscribers').delete().eq('id', id)
    await fetchData(user.id)
    toast.success('Subscriber removed.')
  }

  const handleExportCSV = (group) => {
    const rows = [
      ['Email', 'Subscribed at'],
      ...group.subscribers.map(s => [s.email, new Date(s.subscribed_at).toLocaleString()])
    ]
    const csv  = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `${group.block.data?.heading || 'subscribers'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalSubs = groups.reduce((acc, g) => acc + g.subscribers.length, 0)

  if (loading) return (
    <DashboardLayout activePage="subscribers" profile={profile}>
      <main className="dashboard__main">
        <div className="dashboard__header">
          <div className="sk" style={{ height: 26, width: 150 }}/>
        </div>
        <div style={{ marginTop: 32 }}>
          <div className="sk" style={{ height: 48, borderRadius: 12, marginBottom: 16 }}/>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="sk" style={{ height: 52, borderRadius: 8, marginBottom: 8 }}/>
          ))}
        </div>
      </main>
    </DashboardLayout>
  )

  return (
    <DashboardLayout activePage="subscribers" profile={profile}>

      <main className="dashboard__main">
        <div className="dashboard__header">
          <div>
            <h1 className="dashboard__title">Subscribers</h1>
            <p className="dashboard__subtitle">Emails collected from your newsletter blocks</p>
          </div>
          {totalSubs > 0 && (
            <div className="subs__total-badge">{totalSubs} total subscriber{totalSubs !== 1 ? 's' : ''}</div>
          )}
        </div>

        {groups.length === 0 ? (
          <div className="dashboard__empty">
            <div className="dashboard__empty-icon">✉️</div>
            <h3>No newsletter blocks yet</h3>
            <p>Add a Newsletter Signup block to your page to start collecting emails</p>
            <a href="/dashboard/blocks" className="dashboard__add-btn">Go to Blocks</a>
          </div>
        ) : (
          <div className="subs__groups">
            {groups.map(({ block, subscribers }) => (
              <div key={block.id} className="subs__group">
                <div className="subs__group-header">
                  <div className="subs__group-info">
                    <div className="subs__group-title">
                      ✉️ {block.data?.heading || 'Newsletter Signup'}
                    </div>
                    {block.data?.subheading && (
                      <div className="subs__group-sub">{block.data.subheading}</div>
                    )}
                  </div>
                  <div className="subs__group-actions">
                    <div className="subs__count">{subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}</div>
                    {profile?.plan !== 'pro' && (
                      <div className="subs__sends-badge" title="Free plan: 1 newsletter send per month">
                        {sendsThisMonth}/1 sends this month
                      </div>
                    )}
                    {subscribers.length > 0 && (
                      <>
                        <button
                          className="subs__send-email-btn"
                          onClick={() => {
                            if (profile?.plan !== 'pro' && sendsThisMonth >= 1) {
                              setUpgradeOpen(true)
                            } else {
                              setComposingId(composingId === block.id ? null : block.id)
                            }
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"/>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                          </svg>
                          Send email
                        </button>
                        <button className="subs__export-btn" onClick={() => handleExportCSV({ block, subscribers })}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                          Export CSV
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {composingId === block.id && (
                  <ComposePanel
                    block={block}
                    subscriberCount={subscribers.length}
                    onClose={() => setComposingId(null)}
                    onLimitReached={() => { setComposingId(null); setUpgradeOpen(true) }}
                    onSent={() => fetchSendsThisMonth(user.id)}
                  />
                )}

                {subscribers.length === 0 ? (
                  <div className="subs__empty">No subscribers yet — share your page to get signups.</div>
                ) : (
                  <div className="subs__table-wrap">
                    <table className="subs__table">
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Subscribed</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscribers.map(sub => (
                          <tr key={sub.id}>
                            <td className="subs__email">{sub.email}</td>
                            <td className="subs__date">
                              {new Date(sub.subscribed_at).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric'
                              })}
                            </td>
                            <td>
                              <button
                                className="dashboard__icon-btn dashboard__icon-btn--danger"
                                onClick={() => handleDelete(sub.id)}
                                title="Remove subscriber"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                  <path d="M10 11v6M14 11v6"/>
                                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {upgradeOpen && (
        <UpgradeModal
          title="Monthly send limit reached"
          message="Free accounts can send 1 newsletter per month. Upgrade to Pro for unlimited sends."
          onClose={() => setUpgradeOpen(false)}
        />
      )}

    </DashboardLayout>
  )
}

export default Subscribers
