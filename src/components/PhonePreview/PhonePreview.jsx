import './PhonePreview.css'

const getEmbedThumb = (url) => {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  if (yt) return `https://img.youtube.com/vi/${yt[1]}/mqdefault.jpg`
  return null
}

export default function PhonePreview({ profile, links, blocks, themeObj }) {
  if (!themeObj) return null

  const t = themeObj
  const activeLinks  = links?.filter(l => l.active) || []
  const activeBlocks = blocks?.filter(b => b.active) || []
  const isDark = t.style === 'dark'

  const getScreenBg = () => {
    if (t.id === 'aurora')   return 'radial-gradient(ellipse at 20% 50%, rgba(100,255,218,0.15) 0%, transparent 50%), linear-gradient(160deg, #0a1628 0%, #0d2040 100%)'
    if (t.id === 'glass')    return 'linear-gradient(135deg, #16213e 0%, #0f3460 50%, #1a1a2e 100%)'
    if (t.id === 'neon')     return '#0a0a0a'
    if (t.id === 'midnight') return 'radial-gradient(ellipse at 50% 0%, rgba(122,106,202,0.3) 0%, transparent 60%), #0d0d1a'
    return `linear-gradient(160deg, ${t.bgGradient} 0%, ${t.bg} 60%)`
  }

  const getPreviewLinkStyle = (index) => {
    if (t.id === 'neon')
      return { background: index === 0 ? 'rgba(0,255,136,0.15)' : 'transparent', border: `1px solid ${index === 0 ? '#00ff88' : 'rgba(0,255,136,0.2)'}`, color: '#00ff88', boxShadow: index === 0 ? '0 0 20px rgba(0,255,136,0.3)' : 'none' }
    if (t.id === 'aurora' || t.id === 'glass')
      return { background: index === 0 ? 'rgba(100,255,218,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${index === 0 ? 'rgba(100,255,218,0.4)' : 'rgba(255,255,255,0.1)'}`, color: index === 0 ? t.accent : '#ffffff', backdropFilter: 'blur(10px)' }
    if (t.id === 'midnight')
      return { background: index === 0 ? 'rgba(122,106,202,0.3)' : 'rgba(255,255,255,0.05)', border: `1px solid ${index === 0 ? 'rgba(122,106,202,0.6)' : 'rgba(255,255,255,0.1)'}`, color: index === 0 ? '#fff' : 'rgba(255,255,255,0.8)', boxShadow: index === 0 ? '0 0 30px rgba(122,106,202,0.3)' : 'none' }
    if (t.id === 'paper')
      return { background: index === 0 ? '#c0392b' : '#fffef9', border: `2px solid ${index === 0 ? '#c0392b' : '#d4c9b0'}`, color: index === 0 ? '#ffffff' : '#2c2c2c', borderRadius: '4px', boxShadow: '2px 2px 0px rgba(0,0,0,0.1)' }
    if (t.id === 'candy')
      return { background: index === 0 ? 'linear-gradient(135deg, #d63384, #fd7e14)' : '#ffffff', border: `2px solid ${index === 0 ? 'transparent' : '#f8b4d9'}`, color: index === 0 ? '#ffffff' : '#d63384', boxShadow: index === 0 ? '0 4px 15px rgba(214,51,132,0.4)' : 'none', borderRadius: '100px' }
    const textColor = t.textColor || t.primary
    return { backgroundColor: index === 0 ? t.primary : (t.cardBg || '#fff'), borderColor: index === 0 ? t.primary : (t.borderColor || `${t.primary}22`), color: index === 0 ? '#ffffff' : textColor }
  }

  const nameColor    = t.textColor    || t.primary
  const bioColor     = t.subtextColor || (isDark ? 'rgba(255,255,255,0.55)' : '#888888')
  const footerColor  = isDark ? 'rgba(255,255,255,0.28)' : '#aaaaaa'
  const blockDivider = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

  const renderBlock = (block, i) => {
    const { type, data } = block

    if (type === 'link') {
      return (
        <div key={block.id} className="ppc__link" style={getPreviewLinkStyle(0)}>
          {data.title || 'Link'}
        </div>
      )
    }

    if (type === 'text') {
      return (
        <div key={block.id} className="ppc__block-text">
          {data.heading && <div className="ppc__block-heading" style={{ color: nameColor }}>{data.heading}</div>}
          {data.body    && <div className="ppc__block-body"    style={{ color: bioColor  }}>{data.body}</div>}
        </div>
      )
    }

    if (type === 'image') {
      return (
        <div key={block.id} className="ppc__block-image">
          <img src={data.url} alt={data.caption || ''} />
          {data.caption && <div className="ppc__block-caption" style={{ color: bioColor }}>{data.caption}</div>}
        </div>
      )
    }

    if (type === 'video') {
      const thumb = getEmbedThumb(data.url)
      return (
        <div key={block.id} className="ppc__block-video">
          {thumb
            ? <div className="ppc__block-video-thumb" style={{ backgroundImage: `url(${thumb})` }}>
                <div className="ppc__block-video-play">▶</div>
              </div>
            : <div className="ppc__block-video-placeholder" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : '#f0f0f0', color: bioColor }}>▶ Video</div>
          }
          {data.title && <div className="ppc__block-caption" style={{ color: bioColor }}>{data.title}</div>}
        </div>
      )
    }

    if (type === 'newsletter') {
      return (
        <div key={block.id} className="ppc__block-newsletter"
          style={{ borderColor: t.primary + '33', background: isDark ? 'rgba(255,255,255,0.05)' : (t.cardBg || '#fff') }}>
          <div className="ppc__block-nl-heading" style={{ color: nameColor }}>
            {data.heading || 'Join my newsletter'}
          </div>
          {data.subheading && (
            <div className="ppc__block-nl-sub" style={{ color: bioColor }}>{data.subheading}</div>
          )}
          <div className="ppc__block-nl-row">
            <div className="ppc__block-nl-input" style={{ borderColor: blockDivider }}>email</div>
            <div className="ppc__block-nl-btn" style={{ background: t.primary, color: '#fff' }}>
              {data.button_text || 'Subscribe'}
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <aside className="phone-preview">
      <div className="phone-preview__header">
        <span>Live Preview</span>
        <div className="phone-preview__dot" style={{ background: t.accent }} />
      </div>

      <div
        className="phone-preview__frame"
        style={{
          borderColor: isDark ? t.accent : t.primary,
          boxShadow: isDark
            ? `0 0 0 1px ${t.accent}33, 0 24px 48px rgba(0,0,0,0.5)`
            : `0 0 0 1px ${t.primary}22, 0 24px 48px rgba(0,0,0,0.18)`,
        }}
      >
        <div className="phone-preview__notch" style={{ background: isDark ? t.accent : t.primary }} />

        <div className="phone-preview__screen" style={{ background: getScreenBg() }}>

          {t.pattern === 'stars'   && <div className="ppo ppo--stars" />}
          {t.pattern === 'grid'    && <div className="ppo ppo--grid"    style={{ '--neon':   t.accent }} />}
          {t.pattern === 'aurora'  && <div className="ppo ppo--aurora"  style={{ '--accent': t.accent }} />}
          {t.pattern === 'glass'   && <div className="ppo ppo--glass"   style={{ '--accent': t.accent }} />}
          {t.pattern === 'noise'   && <div className="ppo ppo--noise" />}
          {t.pattern === 'dots'    && <div className="ppo ppo--dots"    style={{ '--accent': t.accent }} />}
          {t.pattern === 'texture' && <div className="ppo ppo--texture" />}

          <div className={`ppc ppc--${t.font || 'system'}`}>

            {/* Avatar */}
            <div className="ppc__avatar" style={{
              background: profile?.avatar_url ? 'none' : `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
              border: isDark ? `2px solid ${t.accent}55` : `2px solid ${t.primary}33`,
              boxShadow: isDark ? `0 0 14px ${t.accent}44` : undefined,
            }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" />
                : <span>{profile?.username?.[0]?.toUpperCase() || 'U'}</span>
              }
            </div>

            {/* Name */}
            <div className="ppc__name" style={{ color: nameColor }}>
              {profile?.full_name || `@${profile?.username}`}
            </div>

            {/* Bio */}
            <div className="ppc__bio" style={{ color: bioColor }}>
              {profile?.bio || 'Your bio appears here'}
            </div>

            {/* Links */}
            {activeLinks.length > 0 && (
              <div className="ppc__links">
                {activeLinks.slice(0, 4).map((link, i) => (
                  <div key={link.id} className="ppc__link" style={getPreviewLinkStyle(i)}>
                    {link.title}
                  </div>
                ))}
              </div>
            )}

            {/* Blocks */}
            {activeBlocks.length > 0 && (
              <>
                {(activeLinks.length > 0) && (
                  <div className="ppc__divider" style={{ background: blockDivider }} />
                )}
                <div className="ppc__blocks">
                  {activeBlocks.slice(0, 4).map((block, i) => renderBlock(block, i))}
                </div>
              </>
            )}

            {activeLinks.length === 0 && activeBlocks.length === 0 && (
              <div className="ppc__empty" style={{ color: bioColor }}>Your content will appear here</div>
            )}

            {/* Footer */}
            <div className="ppc__footer" style={{ color: footerColor }}>
              vinelink.com/{profile?.username}
            </div>

          </div>
        </div>
      </div>
    </aside>
  )
}