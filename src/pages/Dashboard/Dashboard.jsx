import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../lib/ToastContext'
import AiAssistant from '../../components/AiAssistant/AiAssistant'
import UpgradeModal from '../../components/UpgradeModal/UpgradeModal'
import { getThemeById } from '../../lib/themes'
import PhonePreview from '../../components/PhonePreview/PhonePreview'
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout'
import ProfileAudit from '../../components/ProfileAudit/ProfileAudit'
import QRModal from '../../components/QRModal/QRModal'
import { getProfileUrl, getProfileDisplayUrl } from '../../lib/url'
import usePageMeta from '../../lib/usePageMeta'
import { useAuth } from '../../lib/AuthContext'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './Dashboard.css'

function SortableLink({ link, onEdit, onDelete, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id })
  const [confirming, setConfirming] = useState(false)
  const timerRef = useRef(null)

  const askDelete = () => {
    setConfirming(true)
    timerRef.current = setTimeout(() => setConfirming(false), 4000)
  }
  const cancelDelete = () => {
    clearTimeout(timerRef.current)
    setConfirming(false)
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`dashboard__link-item ${!link.active ? 'dashboard__link-item--inactive' : ''}`}
    >
      <div className="dashboard__link-drag" {...attributes} {...listeners}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
      </div>
      <div className="dashboard__link-info">
        <div className="dashboard__link-title">{link.title}</div>
        <div className="dashboard__link-url">{link.url}</div>
      </div>
      <div className="dashboard__link-actions">
        {confirming ? (
          <>
            <span className="dashboard__delete-confirm-label">Delete?</span>
            <button className="dashboard__icon-btn dashboard__icon-btn--danger" onClick={() => onDelete(link.id)} title="Confirm delete">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
            <button className="dashboard__icon-btn" onClick={cancelDelete} title="Cancel">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </>
        ) : (
          <>
            <button
              className={`dashboard__toggle ${link.active ? 'dashboard__toggle--on' : ''}`}
              onClick={() => onToggle(link.id, link.active)}
            >
              <div className="dashboard__toggle-knob"></div>
            </button>
            <button className="dashboard__icon-btn" onClick={() => onEdit(link)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button className="dashboard__icon-btn dashboard__icon-btn--danger" onClick={askDelete}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function Dashboard() {
  const { user, profile, authLoading, refreshProfile } = useAuth()
  const [links, setLinks] = useState([])
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingLink, setAddingLink] = useState(false)
  const [editingLink, setEditingLink] = useState(null)
  const [newLink, setNewLink] = useState({ title: '', url: '' })
  usePageMeta('Links | Vinelink', 'Manage and share all your links from your Vinelink dashboard.')

  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mobilePreview, setMobilePreview] = useState(false)
  const [error, setError] = useState('')
  const [auditOpen, setAuditOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const toast = useToast()

  const FREE_LINK_LIMIT = 5

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (user) init()
  }, [user])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === '1') {
      toast.success('Welcome to Pro! 🎉')
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [])

  const init = async () => {
    await Promise.all([getLinks(user.id), getBlocks(user.id)])
    setLoading(false)
  }

  const getLinks = async (userId) => {
    const { data } = await supabase.from('links').select('*').eq('user_id', userId).order('position', { ascending: true })
    if (data) setLinks(data)
  }

  const getBlocks = async (userId) => {
    const { data } = await supabase.from('blocks').select('*').eq('user_id', userId).order('position', { ascending: true })
    if (data) setBlocks(data)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = links.findIndex(l => l.id === active.id)
    const newIndex = links.findIndex(l => l.id === over.id)
    const reordered = arrayMove(links, oldIndex, newIndex)
    setLinks(reordered)
    await Promise.all(reordered.map((link, index) =>
      supabase.from('links').update({ position: index }).eq('id', link.id)
    ))
  }

  const handleAddLink = async () => {
    if (!newLink.title || !newLink.url) return
    setSaving(true)
    setError('')
    const title = newLink.title.trim().slice(0, 100)
    let url = newLink.url.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url
    try { const u = new URL(url); if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error() }
    catch { setError('Please enter a valid URL (must start with http:// or https://).'); setSaving(false); return }
    const { error } = await supabase.from('links').insert({
      user_id: user.id, title, url, position: links.length
    })
    if (error) { setError(error.message); toast.error('Failed to add link.') } else {
      setNewLink({ title: '', url: '' })
      setAddingLink(false)
      await getLinks(user.id)
      toast.success('Link added!')
    }
    setSaving(false)
  }

  const handleUpdateLink = async () => {
    if (!editingLink.title || !editingLink.url) return
    setSaving(true)
    const title = editingLink.title.trim().slice(0, 100)
    let url = editingLink.url.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url
    try { const u = new URL(url); if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error() }
    catch { setError('Please enter a valid URL (must start with http:// or https://).'); setSaving(false); return }
    const { error } = await supabase.from('links').update({ title, url }).eq('id', editingLink.id)
    if (!error) { setEditingLink(null); await getLinks(user.id); toast.success('Link updated.') }
    setSaving(false)
  }

  const handleDeleteLink = async (id) => {
    await supabase.from('links').delete().eq('id', id)
    await getLinks(user.id)
    toast.success('Link deleted.')
  }

  const handleToggleLink = async (id, active) => {
    await supabase.from('links').update({ active: !active }).eq('id', id)
    await getLinks(user.id)
    toast.success(active ? 'Link hidden.' : 'Link visible.')
  }

  const handleAiApply = async (applyData) => {
    if (applyData.full_name || applyData.bio || applyData.theme) {
      const updates = {}
      if (applyData.full_name) updates.full_name = applyData.full_name
      if (applyData.bio) updates.bio = applyData.bio
      if (applyData.theme) {
        const { themes: allThemes } = await import('../../lib/themes')
        const t = allThemes.find(t => t.id === applyData.theme)
        if (!t?.pro || profile?.plan === 'pro') updates.theme = applyData.theme
      }
      await supabase.from('profiles').update(updates).eq('id', user.id)
      await refreshProfile()
    }
    if (applyData.links?.length > 0) {
      await Promise.all(applyData.links.map(l =>
        supabase.from('links').update({ title: l.title }).eq('id', l.id)
      ))
      await getLinks(user.id)
    }
  }

  if (authLoading || loading) {
    return (
      <DashboardLayout activePage="links" profile={profile}>
        <main className="dashboard__main">
          <div className="dashboard__header">
            <div>
              <div className="sk" style={{ height: 26, width: 140, marginBottom: 10 }}/>
              <div className="sk" style={{ height: 14, width: 220 }}/>
            </div>
          </div>
          <div className="sk" style={{ height: 50, borderRadius: 12, margin: '24px 0 28px' }}/>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="sk" style={{ height: 64, borderRadius: 12, marginBottom: 10 }}/>
          ))}
        </main>
      </DashboardLayout>
    )
  }

  const activeLinks = links.filter(l => l.active)
  const activeBlocks = blocks.filter(b => b.active)

  return (
    <DashboardLayout activePage="links" profile={profile}>

      <main className="dashboard__main">
        <div className="dashboard__header">
          <div>
            <h1 className="dashboard__title">Your Links</h1>
            <p className="dashboard__subtitle">Drag to reorder. Toggle to show or hide.</p>
          </div>
          <div className="dashboard__header-actions">
            <button className="dashboard__audit-btn" onClick={() => setAuditOpen(true)} title="Audit page">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <span>Audit page</span>
            </button>
            <a href={getProfileUrl(profile?.username)} target="_blank" rel="noreferrer" className="dashboard__preview-btn" title="Preview page">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              <span>Preview page</span>
            </a>
            <button
              className="dashboard__add-btn"
              onClick={() => {
                if (profile?.plan !== 'pro' && links.length >= FREE_LINK_LIMIT) {
                  setUpgradeOpen(true)
                } else {
                  setAddingLink(true)
                }
              }}
              title="Add link"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Add link</span>
            </button>
          </div>
        </div>

        <div className="dashboard__share-bar">
          <span className="dashboard__share-url">{getProfileDisplayUrl(profile?.username)}</span>
          <div className="dashboard__link-actions">
            <button className="dashboard__copy-btn" onClick={() => {
              navigator.clipboard.writeText(getProfileUrl(profile?.username))
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
              toast.success('Link copied!')
            }} title="Copy link">
              <svg className="dashboard__share-bar-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              <span>{copied ? '✓ Copied!' : 'Copy link'}</span>
            </button>
            <button className="dashboard__qr-btn" onClick={() => setQrOpen(true)} title="Get QR code">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <line x1="17" y1="17" x2="17" y2="21"/><line x1="21" y1="17" x2="17" y2="17"/><line x1="21" y1="21" x2="21" y2="17"/>
              </svg>
              <span>QR</span>
            </button>
            <button className="dashboard__mobile-preview-open" onClick={() => setMobilePreview(true)} title="Preview page">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
              </svg>
              <span>Preview</span>
            </button>
          </div>
        </div>

        {profile?.plan !== 'pro' && links.length > 0 && (
          <div className="dashboard__plan-bar">
            <span>{links.length}/{FREE_LINK_LIMIT} links used</span>
            {links.length >= FREE_LINK_LIMIT && (
              <button className="dashboard__plan-bar-upgrade" onClick={() => setUpgradeOpen(true)}>
                Upgrade for unlimited
              </button>
            )}
          </div>
        )}

        {error && <div className="dashboard__error">{error}</div>}

        {addingLink && (
          <div className="dashboard__link-form">
            <h3 className="dashboard__form-title">Add new link</h3>
            <div className="dashboard__form-fields">
              <input className="dashboard__input" type="text" placeholder="Title (e.g. My YouTube Channel)" value={newLink.title} onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}/>
              <input className="dashboard__input" type="text" placeholder="URL (e.g. youtube.com/yourchannel)" value={newLink.url} onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}/>
            </div>
            <div className="dashboard__form-actions">
              <button className="dashboard__cancel-btn" onClick={() => { setAddingLink(false); setNewLink({ title: '', url: '' }) }}>Cancel</button>
              <button className="dashboard__save-btn" onClick={handleAddLink} disabled={saving}>{saving ? 'Saving...' : 'Add link'}</button>
            </div>
          </div>
        )}

        {editingLink && (
          <div className="dashboard__link-form">
            <h3 className="dashboard__form-title">Edit link</h3>
            <div className="dashboard__form-fields">
              <input className="dashboard__input" type="text" value={editingLink.title} onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })}/>
              <input className="dashboard__input" type="text" value={editingLink.url} onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}/>
            </div>
            <div className="dashboard__form-actions">
              <button className="dashboard__cancel-btn" onClick={() => setEditingLink(null)}>Cancel</button>
              <button className="dashboard__save-btn" onClick={handleUpdateLink} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        )}

        <div className="dashboard__links">
          {links.length === 0 && !addingLink ? (
            <div className="dashboard__empty">
              <div className="dashboard__empty-icon">🔗</div>
              <h3>No links yet</h3>
              <p>Add your first link to get started</p>
              <button className="dashboard__add-btn" onClick={() => {
                if (profile?.plan !== 'pro' && links.length >= FREE_LINK_LIMIT) setUpgradeOpen(true)
                else setAddingLink(true)
              }}>Add your first link</button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={links.map(l => l.id)} strategy={verticalListSortingStrategy}>
                {links.map((link) => (
                  <SortableLink key={link.id} link={link} onEdit={setEditingLink} onDelete={handleDeleteLink} onToggle={handleToggleLink}/>
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </main>

      <PhonePreview
        profile={profile}
        links={activeLinks}
        blocks={activeBlocks}
        themeObj={getThemeById(profile?.theme)}
      />

      <AiAssistant user={user} profile={profile} links={links} onApply={handleAiApply}/>

      {mobilePreview && (
        <div className="mobile-preview__overlay" onClick={() => setMobilePreview(false)}>
          <div className="mobile-preview__sheet" onClick={e => e.stopPropagation()}>
            <button className="mobile-preview__close" onClick={() => setMobilePreview(false)}>✕ Close</button>
            <PhonePreview
              profile={profile}
              links={activeLinks}
              blocks={activeBlocks}
              themeObj={getThemeById(profile?.theme)}
            />
          </div>
        </div>
      )}

      <ProfileAudit
        profile={profile}
        links={links}
        blocks={blocks}
        isOpen={auditOpen}
        onClose={() => setAuditOpen(false)}
      />

      {qrOpen && (
        <QRModal
          username={profile?.username}
          url={getProfileUrl(profile?.username)}
          onClose={() => setQrOpen(false)}
        />
      )}

      {upgradeOpen && (
        <UpgradeModal
          title="Link limit reached"
          message={`Free accounts can have up to ${FREE_LINK_LIMIT} links. Upgrade to Pro for unlimited links.`}
          onClose={() => setUpgradeOpen(false)}
        />
      )}

    </DashboardLayout>
  )
}

export default Dashboard;
