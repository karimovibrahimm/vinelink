import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id })

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
      <div
        className="dashboard__link-drag"
        {...attributes}
        {...listeners}
      >
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
        <button className="dashboard__icon-btn dashboard__icon-btn--danger" onClick={() => onDelete(link.id)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

function Dashboard() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingLink, setAddingLink] = useState(false)
  const [editingLink, setEditingLink] = useState(null)
  const [newLink, setNewLink] = useState({ title: '', url: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => { getUser() }, [])

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

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = links.findIndex(l => l.id === active.id)
    const newIndex = links.findIndex(l => l.id === over.id)
    const reordered = arrayMove(links, oldIndex, newIndex)

    setLinks(reordered)

    // Update positions in Supabase
    await Promise.all(
      reordered.map((link, index) =>
        supabase.from('links').update({ position: index }).eq('id', link.id)
      )
    )
  }

  const handleAddLink = async () => {
    if (!newLink.title || !newLink.url) return
    setSaving(true)
    setError('')

    let url = newLink.url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }

    const { error } = await supabase.from('links').insert({
      user_id: user.id,
      title: newLink.title,
      url,
      position: links.length
    })

    if (error) {
      setError(error.message)
    } else {
      setNewLink({ title: '', url: '' })
      setAddingLink(false)
      await getLinks(user.id)
    }
    setSaving(false)
  }

  const handleUpdateLink = async () => {
    if (!editingLink.title || !editingLink.url) return
    setSaving(true)

    let url = editingLink.url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }

    const { error } = await supabase
      .from('links')
      .update({ title: editingLink.title, url })
      .eq('id', editingLink.id)

    if (!error) {
      setEditingLink(null)
      await getLinks(user.id)
    }
    setSaving(false)
  }

  const handleDeleteLink = async (id) => {
    await supabase.from('links').delete().eq('id', id)
    await getLinks(user.id)
  }

  const handleToggleLink = async (id, active) => {
    await supabase.from('links').update({ active: !active }).eq('id', id)
    await getLinks(user.id)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="dashboard__loading">
        <div className="dashboard__spinner"></div>
        <p>Loading your dashboard...</p>
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
          <a href="/dashboard" className="dashboard__nav-item dashboard__nav-item--active">
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
          <a href="/dashboard/analytics" className="dashboard__nav-item">
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

      {/* Main Content */}
      <main className="dashboard__main">
        <div className="dashboard__header">
          <div>
            <h1 className="dashboard__title">Your Links</h1>
            <p className="dashboard__subtitle">Drag to reorder. Toggle to show or hide.</p>
          </div>
          <div className="dashboard__header-actions">
            <a
              href={`/${profile?.username}`}
              target="_blank"
              rel="noreferrer"
              className="dashboard__preview-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Preview page
            </a>
            <button className="dashboard__add-btn" onClick={() => setAddingLink(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add link
            </button>
          </div>
        </div>

        <div className="dashboard__share-bar">
          <span className="dashboard__share-url">vinelink.com/{profile?.username}</span>
          <button
            className="dashboard__copy-btn"
            onClick={() => navigator.clipboard.writeText(`https://vinelink.com/${profile?.username}`)}
          >
            Copy link
          </button>
        </div>

        {error && <div className="dashboard__error">{error}</div>}

        {addingLink && (
          <div className="dashboard__link-form">
            <h3 className="dashboard__form-title">Add new link</h3>
            <div className="dashboard__form-fields">
              <input
                className="dashboard__input"
                type="text"
                placeholder="Title (e.g. My YouTube Channel)"
                value={newLink.title}
                onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
              />
              <input
                className="dashboard__input"
                type="text"
                placeholder="URL (e.g. youtube.com/yourchannel)"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              />
            </div>
            <div className="dashboard__form-actions">
              <button
                className="dashboard__cancel-btn"
                onClick={() => { setAddingLink(false); setNewLink({ title: '', url: '' }) }}
              >
                Cancel
              </button>
              <button className="dashboard__save-btn" onClick={handleAddLink} disabled={saving}>
                {saving ? 'Saving...' : 'Add link'}
              </button>
            </div>
          </div>
        )}

        {editingLink && (
          <div className="dashboard__link-form">
            <h3 className="dashboard__form-title">Edit link</h3>
            <div className="dashboard__form-fields">
              <input
                className="dashboard__input"
                type="text"
                value={editingLink.title}
                onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })}
              />
              <input
                className="dashboard__input"
                type="text"
                value={editingLink.url}
                onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
              />
            </div>
            <div className="dashboard__form-actions">
              <button className="dashboard__cancel-btn" onClick={() => setEditingLink(null)}>Cancel</button>
              <button className="dashboard__save-btn" onClick={handleUpdateLink} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        <div className="dashboard__links">
          {links.length === 0 && !addingLink ? (
            <div className="dashboard__empty">
              <div className="dashboard__empty-icon">🔗</div>
              <h3>No links yet</h3>
              <p>Add your first link to get started</p>
              <button className="dashboard__add-btn" onClick={() => setAddingLink(true)}>
                Add your first link
              </button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={links.map(l => l.id)}
                strategy={verticalListSortingStrategy}
              >
                {links.map((link) => (
                  <SortableLink
                    key={link.id}
                    link={link}
                    onEdit={setEditingLink}
                    onDelete={handleDeleteLink}
                    onToggle={handleToggleLink}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </main>

      {/* Right Preview */}
      <aside className="dashboard__preview">
        <div className="dashboard__preview-header">
          <span>Live Preview</span>
          <div className="dashboard__preview-dot"></div>
        </div>
        <div className="dashboard__phone">
          <div className="dashboard__phone-notch"></div>
          <div className="dashboard__phone-screen">
            <div className="dashboard__mock-profile">
              <div className="dashboard__mock-avatar">
                {profile?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="dashboard__mock-name">@{profile?.username}</div>
              <div className="dashboard__mock-bio">{profile?.bio || 'Add a bio in appearance'}</div>
            </div>
            <div className="dashboard__mock-links">
              {links.filter(l => l.active).length === 0 ? (
                <div className="dashboard__mock-empty">Your links will appear here</div>
              ) : (
                links.filter(l => l.active).map((link, i) => (
                  <div
                    key={link.id}
                    className={`dashboard__mock-link ${i === 0 ? 'dashboard__mock-link--first' : ''}`}
                  >
                    {link.title}
                  </div>
                ))
              )}
            </div>
            <div className="dashboard__mock-footer">vinelink.com/{profile?.username}</div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="dashboard__mobile-nav">
        <a href="/dashboard" className="dashboard__mobile-nav-item dashboard__mobile-nav-item--active">
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
        <a href="/dashboard/analytics" className="dashboard__mobile-nav-item">
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

export default Dashboard