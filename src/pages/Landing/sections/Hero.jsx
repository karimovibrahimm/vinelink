import './Hero.css'

function Hero() {
  return (
    <section className="hero">
      <div className="hero__container">

        {/* Left side - Text */}
        <div className="hero__content">
          <div className="hero__badge">
            <span>🌿</span>
            <span>The smarter link-in-bio</span>
          </div>

          <h1 className="hero__title">
            One link.<br />
            <span className="hero__title--accent">Everything</span> you are.
          </h1>

          <p className="hero__subtitle">
            Vinelink turns your single bio link into a beautiful, branded page that showcases everything you do — your content, store, socials, and more.
          </p>

          <div className="hero__cta">
            <a href="/signup" className="hero__cta--primary">
              Create your Vinelink free
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
            <a href="#examples" className="hero__cta--secondary">
              See an example
            </a>
          </div>

          <div className="hero__social-proof">
            <div className="hero__avatars">
              <div className="hero__avatar" style={{background: '#e8b4b8'}}>A</div>
              <div className="hero__avatar" style={{background: '#b4d4e8'}}>M</div>
              <div className="hero__avatar" style={{background: '#b4e8c4'}}>J</div>
              <div className="hero__avatar" style={{background: '#e8dbb4'}}>S</div>
              <div className="hero__avatar" style={{background: '#d4b4e8'}}>K</div>
            </div>
            <div className="hero__proof-text">
              <div className="hero__stars">★★★★★</div>
              <span>Loved by <strong>10,000+</strong> creators</span>
            </div>
          </div>
        </div>

        {/* Right side - Phone mockup */}
        <div className="hero__visual">
          <div className="hero__phone">
            <div className="hero__phone-notch"></div>
            <div className="hero__phone-screen">

              {/* Profile */}
              <div className="hero__mock-profile">
                <div className="hero__mock-avatar">S</div>
                <div className="hero__mock-name">Sarah Williams</div>
                <div className="hero__mock-bio">Content creator & photographer 📸</div>
              </div>

              {/* Links */}
              <div className="hero__mock-links">
                <div className="hero__mock-link hero__mock-link--featured">
                  ✨ My Latest YouTube Video
                </div>
                <div className="hero__mock-link">
                  🛍️ Shop my favorites
                </div>
                <div className="hero__mock-link">
                  📸 Photography Presets
                </div>
                <div className="hero__mock-link">
                  📩 Work with me
                </div>
              </div>

              {/* Social icons */}
              <div className="hero__mock-socials">
                <div className="hero__mock-social">in</div>
                <div className="hero__mock-social">tw</div>
                <div className="hero__mock-social">yt</div>
                <div className="hero__mock-social">ig</div>
              </div>

              <div className="hero__mock-footer">vinelink.com/sarah</div>
            </div>
          </div>

          {/* Floating cards */}
          <div className="hero__float hero__float--1">
            <span>🔥</span>
            <div>
              <div className="hero__float-title">1,240 clicks</div>
              <div className="hero__float-sub">today</div>
            </div>
          </div>

          <div className="hero__float hero__float--2">
            <span>⚡</span>
            <div>
              <div className="hero__float-title">Set up in</div>
              <div className="hero__float-sub">2 minutes</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

export default Hero