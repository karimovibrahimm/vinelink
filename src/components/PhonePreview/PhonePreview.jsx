import './PhonePreview.css'

export default function PhonePreview({ profile, links, themeObj }) {
  if (!themeObj) return null

  const t = themeObj
  const activeLinks = links?.filter(l => l.active) || []
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

  const nameColor = t.textColor || t.primary
  const bioColor = t.subtextColor || (isDark ? 'rgba(255,255,255,0.55)' : '#888888')
  const footerColor = isDark ? 'rgba(255,255,255,0.28)' : '#aaaaaa'

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

          {/* Pattern overlays — one per theme.pattern value */}
          {t.pattern === 'stars'   && <div className="ppo ppo--stars" />}
          {t.pattern === 'grid'    && <div className="ppo ppo--grid"  style={{ '--neon': t.accent }} />}
          {t.pattern === 'aurora'  && <div className="ppo ppo--aurora" style={{ '--accent': t.accent }} />}
          {t.pattern === 'glass'   && <div className="ppo ppo--glass"  style={{ '--accent': t.accent }} />}
          {t.pattern === 'noise'   && <div className="ppo ppo--noise" />}
          {t.pattern === 'dots'    && <div className="ppo ppo--dots"   style={{ '--accent': t.accent }} />}
          {t.pattern === 'texture' && <div className="ppo ppo--texture" />}

          <div className={`ppc ppc--${t.font || 'system'}`}>
            {/* Avatar */}
            <div
              className="ppc__avatar"
              style={{
                background: profile?.avatar_url ? 'none' : `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
                border: isDark ? `2px solid ${t.accent}55` : `2px solid ${t.primary}33`,
                boxShadow: isDark ? `0 0 14px ${t.accent}44` : undefined,
              }}
            >
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
            <div className="ppc__links">
              {activeLinks.length === 0 ? (
                <div className="ppc__empty" style={{ color: bioColor }}>Your links will appear here</div>
              ) : (
                activeLinks.slice(0, 5).map((link, i) => (
                  <div key={link.id} className="ppc__link" style={i === 0 ? primaryLinkStyle : secondaryLinkStyle}>
                    {link.title}
                  </div>
                ))
              )}
            </div>

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