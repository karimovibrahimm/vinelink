import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './Blocks.css'

// ─── Block type config ────────────────────────────────────────────────────────
const BLOCK_TYPES = [
  {
    type: 'link',
    label: 'Link',
    icon: '🔗',
    description: 'A clickable button that opens a URL',
    fields: [
      { key: 'title', label: 'Title', placeholder: 'e.g. My YouTube Channel', type: 'text' },
      { key: 'url',   label: 'URL',   placeholder: 'e.g. youtube.com/yourchannel', type: 'text' },
    ],
  },
  {
    type: 'text',
    label: 'Text / Heading',
    icon: '📝',
    description: 'A heading or paragraph of text',
    fields: [
      { key: 'heading', label: 'Heading (optional)', placeholder: 'e.g. About me', type: 'text' },
      { key: 'body',    label: 'Body text',          placeholder: 'Write something...', type: 'textarea' },
    ],
  },
  {
    type: 'image',
    label: 'Image',
    icon: '🖼️',
    description: 'Display an image with an optional caption',
    fields: [
      { key: 'url',     label: 'Image URL',          placeholder: 'https://...', type: 'text' },
      { key: 'caption', label: 'Caption (optional)', placeholder: 'e.g. Me at the summit', type: 'text' },
      { key: 'link',    label: 'Link on click (optional)', placeholder: 'https://...', type: 'text' },
    ],
  },
  {
    type: 'video',
    label: 'Video Embed',
    icon: '▶️',
    description: 'Embed a YouTube or Vimeo video',
    fields: [
      { key: 'url',   label: 'Video URL', placeholder: 'https://youtube.com/watch?v=... or youtu.be/...', type: 'text' },
      { key: 'title', label: 'Title (optional)', placeholder: 'e.g. My latest vlog', type: 'text' },
    ],
  },
  {
    type: 'newsletter',
    label: 'Newsletter Signup',
    icon: '✉️',
    description: 'Collect email addresses from your audience',
    fields: [
      { key: 'heading',     label: 'Heading',          placeholder: 'e.g. Join my newsletter', type: 'text' },
      { key: 'subheading',  label: 'Subheading',       placeholder: 'e.g. Weekly tips, no spam', type: 'text' },
      { key: 'button_text', label: 'Button label',     placeholder: 'e.g. Subscribe', type: 'text' },
    ],
  },
  {
    type: 'spotify',
    label: 'Spotify',
    icon: '🎵',
    description: 'Embed a Spotify track, album, playlist, or podcast episode',
    fields: [
      { key: 'url',   label: 'Spotify URL',     placeholder: 'https://open.spotify.com/track/...', type: 'text' },
      { key: 'title', label: 'Title (optional)', placeholder: 'e.g. My latest track', type: 'text' },
    ],
  },
]

const getBlockMeta = (type) => BLOCK_TYPES.find(b => b.type === type) || BLOCK_TYPES[0]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getSpotifyEmbed = (url) => {
  if (!url) return null
  const match = url.match(/open\.spotify\.com\/(?:[^/]+\/)?(track|album|playlist|episode|show|artist)\/([^?&/]+)/)
  if (match) return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator`
  return null
}

const getVideoEmbed = (url) => {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return null
}

const getBlockSummary = (block) => {
  const { type, data } = block
  if (type === 'link')       return data.title || 'Untitled link'
  if (type === 'text')       return data.heading || data.body?.slice(0, 40) || 'Text block'
  if (type === 'image')      return data.caption || data.url?.slice(0, 40) || 'Image block'
  if (type === 'video')      return data.title || data.url?.slice(0, 40) || 'Video block'
  if (type === 'newsletter') return data.heading || 'Newsletter signup'
  if (type === 'spotify')    return data.title   || data.url?.slice(0, 40) || 'Spotify embed'
  return 'Block'
}

// ─── Drag handle icon ─────────────────────────────────────────────────────────
const DragIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)

// ─── Sortable block row ───────────────────────────────────────────────────────
function SortableBlock({ block, onEdit, onDelete, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const meta = getBlockMeta(block.type)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 10 : 1 }}
      className={`blocks__item ${!block.active ? 'blocks__item--inactive' : ''}`}
    >
      <div className="blocks__drag" {...attributes} {...listeners}><DragIcon /></div>

      <div className="blocks__type-badge">{meta.icon}</div>

      <div className="blocks__info">
        <div className="blocks__summary">{getBlockSummary(block)}</div>
        <div className="blocks__type-label">{meta.label}</div>
      </div>

      <div className="blocks__actions">
        <button
          className={`dashboard__toggle ${block.active ? 'dashboard__toggle--on' : ''}`}
          onClick={() => onToggle(block.id, block.active)}
        >
          <div className="dashboard__toggle-knob" />
        </button>
        <button className="dashboard__icon-btn" onClick={() => onEdit(block)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button className="dashboard__icon-btn dashboard__icon-btn--danger" onClick={() => onDelete(block.id)}>
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

// ─── Block form (add / edit) ──────────────────────────────────────────────────
function BlockForm({ initial, onSave, onCancel, saving }) {
  const isEditing = !!initial?.id
  const [type, setType] = useState(initial?.type || 'link')
  const [data, setData] = useState(initial?.data || {})

  const meta = getBlockMeta(type)

  const handleTypeChange = (t) => { setType(t); setData({}) }
  const set = (key, val) => setData(prev => ({ ...prev, [key]: val }))

  return (
    <div className="blocks__form">
      <h3 className="dashboard__form-title">{isEditing ? 'Edit block' : 'Add block'}</h3>

      {!isEditing && (
        <div className="blocks__type-picker">
          {BLOCK_TYPES.map(bt => (
            <button
              key={bt.type}
              className={`blocks__type-btn ${type === bt.type ? 'blocks__type-btn--active' : ''}`}
              onClick={() => handleTypeChange(bt.type)}
            >
              <span className="blocks__type-btn-icon">{bt.icon}</span>
              <span className="blocks__type-btn-label">{bt.label}</span>
            </button>
          ))}
        </div>
      )}

      <p className="blocks__form-desc">{meta.description}</p>

      <div className="dashboard__form-fields">
        {meta.fields.map(field => (
          <div key={field.key} className="blocks__field">
            <label className="appearance__label">{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea
                className="dashboard__input blocks__textarea"
                placeholder={field.placeholder}
                value={data[field.key] || ''}
                onChange={e => set(field.key, e.target.value)}
              />
            ) : (
              <input
                className="dashboard__input"
                type="text"
                placeholder={field.placeholder}
                value={data[field.key] || ''}
                onChange={e => set(field.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="dashboard__form-actions">
        <button className="dashboard__cancel-btn" onClick={onCancel}>Cancel</button>
        <button className="dashboard__save-btn" onClick={() => onSave(type, data)} disabled={saving}>
          {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Add block'}
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
function Blocks() {
  const [user, setUser]         = useState(null)
  const [profile, setProfile]   = useState(null)
  const [blocks, setBlocks]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [adding, setAdding]     = useState(false)
  const [editing, setEditing]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUser(user)
    await Promise.all([fetchProfile(user.id), fetchBlocks(user.id)])
    setLoading(false)
  }

  const fetchProfile = async (uid) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    if (data) setProfile(data)
  }

  const fetchBlocks = async (uid) => {
    const { data } = await supabase.from('blocks').select('*').eq('user_id', uid).order('position', { ascending: true })
    if (data) setBlocks(data)
  }

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIdx = blocks.findIndex(b => b.id === active.id)
    const newIdx = blocks.findIndex(b => b.id === over.id)
    const reordered = arrayMove(blocks, oldIdx, newIdx)
    setBlocks(reordered)
    await Promise.all(reordered.map((b, i) => supabase.from('blocks').update({ position: i }).eq('id', b.id)))
  }

  const handleAdd = async (type, data) => {
    setSaving(true)
    setError('')
    // auto-prepend https for url fields
    const cleanData = { ...data }
    if (cleanData.url && !cleanData.url.startsWith('http')) cleanData.url = 'https://' + cleanData.url
    if (cleanData.link && !cleanData.link.startsWith('http')) cleanData.link = 'https://' + cleanData.link

    const { error } = await supabase.from('blocks').insert({
      user_id: user.id, type, data: cleanData, position: blocks.length
    })
    if (error) { setError(error.message) } else {
      setAdding(false)
      await fetchBlocks(user.id)
    }
    setSaving(false)
  }

  const handleUpdate = async (type, data) => {
    setSaving(true)
    const cleanData = { ...data }
    if (cleanData.url && !cleanData.url.startsWith('http')) cleanData.url = 'https://' + cleanData.url
    if (cleanData.link && !cleanData.link.startsWith('http')) cleanData.link = 'https://' + cleanData.link

    const { error } = await supabase.from('blocks').update({ data: cleanData }).eq('id', editing.id)
    if (!error) { setEditing(null); await fetchBlocks(user.id) }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    await supabase.from('blocks').delete().eq('id', id)
    await fetchBlocks(user.id)
  }

  const handleToggle = async (id, active) => {
    await supabase.from('blocks').update({ active: !active }).eq('id', id)
    await fetchBlocks(user.id)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return (
    <div className="dashboard__loading">
      <div className="dashboard__spinner" />
      <p>Loading blocks...</p>
    </div>
  )

  // ─── NAV shared markup ─────────────────────────────────────────────────────
  const sidebarNav = (
    <nav className="dashboard__nav">
      {[
        { href: '/dashboard',            label: 'Links',      active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
        { href: '/dashboard/blocks',     label: 'Blocks',     active: true,  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><path d="M17 13v2m0 4v2m-2-4h2m2 0h2" strokeLinecap="round"/></svg> },
        { href: '/dashboard/appearance', label: 'Appearance', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
        { href: '/dashboard/analytics',  label: 'Analytics',  active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
        { href: '/dashboard/subscribers', label: 'Subscribers', active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
        { href: '/dashboard/settings',   label: 'Settings',   active: false, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
      ].map(item => (
        <a key={item.href} href={item.href} className={`dashboard__nav-item ${item.active ? 'dashboard__nav-item--active' : ''}`}>
          {item.icon}{item.label}
        </a>
      ))}
    </nav>
  )

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
        {sidebarNav}
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

      {/* Main */}
      <main className="dashboard__main">
        <div className="dashboard__header">
          <div>
            <h1 className="dashboard__title">Creator Blocks</h1>
            <p className="dashboard__subtitle">Add text, images, videos, and more to your page</p>
          </div>
          <div className="dashboard__header-actions">
            <a href={`https://${profile?.username}.vinelink.xyz`} target="_blank" rel="noreferrer" className="dashboard__preview-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Preview page
            </a>
            <button className="dashboard__add-btn" onClick={() => { setAdding(true); setEditing(null) }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add block
            </button>
          </div>
        </div>

        {error && <div className="dashboard__error">{error}</div>}

        {adding && (
          <BlockForm
            onSave={handleAdd}
            onCancel={() => setAdding(false)}
            saving={saving}
          />
        )}

        {editing && (
          <BlockForm
            initial={editing}
            onSave={handleUpdate}
            onCancel={() => setEditing(null)}
            saving={saving}
          />
        )}

        <div className="blocks__hint">
          Blocks appear on your public page <strong>below your links</strong>. Drag to reorder, toggle to show/hide.
        </div>

        <div className="blocks__list">
          {blocks.length === 0 && !adding ? (
            <div className="dashboard__empty">
              <div className="dashboard__empty-icon">✨</div>
              <h3>No blocks yet</h3>
              <p>Add your first creator block to make your page a mini-website</p>
              <button className="dashboard__add-btn" onClick={() => setAdding(true)}>Add your first block</button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                {blocks.map(block => (
                  <SortableBlock
                    key={block.id}
                    block={block}
                    onEdit={b => { setEditing(b); setAdding(false) }}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </main>

      {/* Mobile nav */}
      <nav className="dashboard__mobile-nav">
        {[
          { href: '/dashboard',            label: 'Links',      active: false, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
          { href: '/dashboard/blocks',     label: 'Blocks',     active: true,  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><path d="M17 13v2m0 4v2m-2-4h2m2 0h2"/></svg> },
          { href: '/dashboard/appearance', label: 'Appearance', active: false, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
          { href: '/dashboard/analytics',  label: 'Analytics',      active: false, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
          { href: '/dashboard/subscribers', label: 'Subscribers', active: false, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
          { href: '/dashboard/settings',   label: 'Settings',   active: false, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65,1.65,0,004,4z"/></svg> },
        ].map(item => (
          <a key={item.href} href={item.href} className={`dashboard__mobile-nav-item ${item.active ? 'dashboard__mobile-nav-item--active' : ''}`}>
            {item.icon}<span>{item.label}</span>
          </a>
        ))}
      </nav>

    </div>
  )
}

export default Blocks