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

  const screenBg = `linear-gradient(180deg, ${t.bg} 0%, ${t.bgGradient} 100%)`

  const primaryLinkStyle = {
    background: isDark ? t.accent : t.primary,
    color: isDark ? t.bg : '#ffffff',
    border: '1.5px solid transparent',
    boxShadow: isDark ? `0 0 10px ${t.accent}55` : '0 2px 8px rgba(0,0,0,0.15)',
  }

  const secondaryLinkStyle = {
    background: t.cardBg || '#fff',
    color: t.textColor || t.primary,
    border: `1.5px solid ${t.borderColor || t.primary + '22'}`,
    boxShadow: isDark ? `inset 0 0 0 1px ${t.accent}22` : 'none',
  }

  const nameColor    = t.textColor    || t.primary
  const bioColor     = t.subtextColor || (isDark ? 'rgba(255,255,255,0.55)' : '#888888')
  const footerColor  = isDark ? 'rgba(255,255,255,0.28)' : '#aaaaaa'
  const blockDivider = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

  const renderBlock = (block, i) => {
    const { type, data } = block

    if (type === 'link') {
      return (
        <div key={block.id} className="ppc__link" style={primaryLinkStyle}>
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

        <div className="phone-preview__screen" style={{ background: screenBg }}>

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
                  <div key={link.id} className="ppc__link" style={i === 0 ? primaryLinkStyle : secondaryLinkStyle}>
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