import { useState } from 'react'
import './Navbar.css'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="navbar">
      <div className="navbar__container">

        {/* Logo */}
        <a href="/" className="navbar__logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 4 C14 4 8 8 8 14 C8 18 10 21 14 24 C18 21 20 18 20 14 C20 8 14 4 14 4Z" fill="#c9a84c"/>
            <path d="M14 24 C14 24 10 20 8 16 C10 17 13 17 14 24Z" fill="#1a3a2a"/>
            <path d="M14 24 C14 24 18 20 20 16 C18 17 15 17 14 24Z" fill="#1a3a2a"/>
            <line x1="14" y1="24" x2="14" y2="28" stroke="#1a3a2a" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>Vinelink</span>
        </a>

        {/* Desktop Nav */}
        <ul className="navbar__links">
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#examples">Examples</a></li>
        </ul>

        {/* CTA */}
        <div className="navbar__actions">
          <a href="/login" className="navbar__login">Log in</a>
          <a href="/signup" className="navbar__cta">Get Started Free</a>
        </div>

        {/* Mobile hamburger */}
        <button className="navbar__hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="navbar__mobile">
          <a href="/#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="/#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
          <a href="/#examples" onClick={() => setMenuOpen(false)}>Examples</a>
          <a href="/login" onClick={() => setMenuOpen(false)}>Log in</a>
          <a href="/signup" className="navbar__cta" onClick={() => setMenuOpen(false)}>Get Started Free</a>
        </div>
      )}
    </nav>
  )
}

export default Navbar