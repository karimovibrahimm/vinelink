import './FooterCTA.css'

function FooterCTA() {
  return (
    <>
      {/* Final CTA Banner */}
      <section className="finalcta">
        <div className="finalcta__container">
          <div className="finalcta__content">
            <h2 className="finalcta__title">Your link. Your brand.<br />Start free today.</h2>
            <p className="finalcta__subtitle">
              Join 10,000+ creators already using Vinelink. No credit card required.
            </p>
            <div className="finalcta__form">
              <input
                type="email"
                placeholder="Enter your email address"
                className="finalcta__input"
              />
              <a href="/signup" className="finalcta__btn">
                Get started free
              </a>
            </div>
            <p className="finalcta__note">Free forever. Upgrade anytime.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer__container">

          <div className="footer__top">

            {/* Brand */}
            <div className="footer__brand">
              <div className="footer__logo">
                <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                  <path d="M14 4 C14 4 8 8 8 14 C8 18 10 21 14 24 C18 21 20 18 20 14 C20 8 14 4 14 4Z" fill="#c9a84c"/>
                  <path d="M14 24 C14 24 10 20 8 16 C10 17 13 17 14 24Z" fill="#1a3a2a"/>
                  <path d="M14 24 C14 24 18 20 20 16 C18 17 15 17 14 24Z" fill="#1a3a2a"/>
                  <line x1="14" y1="24" x2="14" y2="28" stroke="#1a3a2a" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>Vinelink</span>
              </div>
              <p className="footer__tagline">
                The beautiful, affordable link-in-bio for creators who mean business.
              </p>
              <div className="footer__socials">
                <a href="#" className="footer__social" aria-label="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <circle cx="12" cy="12" r="4"/>
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                  </svg>
                </a>
                <a href="#" className="footer__social" aria-label="Twitter">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
                  </svg>
                </a>
                <a href="#" className="footer__social" aria-label="TikTok">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Links */}
            <div className="footer__links">
              <div className="footer__col">
                <h4 className="footer__col-title">Product</h4>
                <ul>
                  <li><a href="#features">Features</a></li>
                  <li><a href="#examples">Examples</a></li>
                  <li><a href="/signup">Get started</a></li>
                </ul>
              </div>
              <div className="footer__col">
                <h4 className="footer__col-title">Company</h4>
                <ul>
                  <li><a href="#">About</a></li>
                  <li><a href="#">Blog</a></li>
                  <li><a href="#">Careers</a></li>
                  <li><a href="#">Contact</a></li>
                </ul>
              </div>
              <div className="footer__col">
                <h4 className="footer__col-title">Legal</h4>
                <ul>
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Terms of Service</a></li>
                  <li><a href="#">Cookie Policy</a></li>
                </ul>
              </div>
            </div>

          </div>

          <div className="footer__bottom">
            <p>© 2025 Vinelink. All rights reserved.</p>
            <p>Made with 🌿 for creators everywhere.</p>
          </div>

        </div>
      </footer>
    </>
  )
}

export default FooterCTA