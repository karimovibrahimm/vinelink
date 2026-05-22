import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './Blocks.css'
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout'
import { getProfileUrl } from '../../lib/url'
import usePageMeta from '../../lib/usePageMeta'
import { useToast } from '../../lib/ToastContext'

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
  const [confirming, setConfirming] = useState(false)
  const timerRef = useRef(null)
  const meta = getBlockMeta(block.type)

  const askDelete = () => {
    setConfirming(true)
    timerRef.current = setTimeout(() => setConfirming(false), 4000)
  }
  const cancelDelete = () => {
    clearTimeout(timerRef.current)
    setConfirming(false)
  }

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
        {confirming ? (
          <>
            <span className="dashboard__delete-confirm-label">Delete?</span>
            <button className="dashboard__icon-btn dashboard__icon-btn--danger" onClick={() => onDelete(block.id)} title="Confirm delete">
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
  usePageMeta('Creator Blocks | Vinelink', 'Add text, images, videos, music and more to your Vinelink page.')
  const toast = useToast()

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
    if (error) { setError(error.message); toast.error('Failed to add block.') } else {
      setAdding(false)
      await fetchBlocks(user.id)
      toast.success('Block added!')
    }
    setSaving(false)
  }

  const handleUpdate = async (type, data) => {
    setSaving(true)
    const cleanData = { ...data }
    if (cleanData.url && !cleanData.url.startsWith('http')) cleanData.url = 'https://' + cleanData.url
    if (cleanData.link && !cleanData.link.startsWith('http')) cleanData.link = 'https://' + cleanData.link

    const { error } = await supabase.from('blocks').update({ data: cleanData }).eq('id', editing.id)
    if (!error) { setEditing(null); await fetchBlocks(user.id); toast.success('Block updated.') }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    await supabase.from('blocks').delete().eq('id', id)
    await fetchBlocks(user.id)
    toast.success('Block deleted.')
  }

  const handleToggle = async (id, active) => {
    await supabase.from('blocks').update({ active: !active }).eq('id', id)
    await fetchBlocks(user.id)
    toast.success(active ? 'Block hidden.' : 'Block visible.')
  }

  if (loading) return (
    <DashboardLayout activePage="blocks" profile={profile}>
      <main className="dashboard__main">
        <div className="dashboard__header">
          <div className="sk" style={{ height: 26, width: 160 }}/>
        </div>
        <div className="sk" style={{ height: 14, width: '80%', margin: '28px 0 20px' }}/>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="sk" style={{ height: 64, borderRadius: 12, marginBottom: 10 }}/>
        ))}
      </main>
    </DashboardLayout>
  )

  return (
    <DashboardLayout activePage="blocks" profile={profile}>

      <main className="dashboard__main">
        <div className="dashboard__header">
          <div>
            <h1 className="dashboard__title">Creator Blocks</h1>
            <p className="dashboard__subtitle">Add text, images, videos, and more to your page</p>
          </div>
          <div className="dashboard__header-actions">
            <a href={getProfileUrl(profile?.username)} target="_blank" rel="noreferrer" className="dashboard__preview-btn">
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

    </DashboardLayout>
  )
}

export default Blocks