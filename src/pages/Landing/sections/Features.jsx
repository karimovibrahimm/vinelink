import './Features.css'

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    title: 'Beautiful Templates',
    description: 'Choose from dozens of stunning, designer-crafted templates. Your page will look unique, not like every other link-in-bio out there.'
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    title: 'Powerful Analytics',
    description: 'See exactly which links get clicked, when, and where your traffic comes from. Make smarter decisions with real data.'
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    title: 'Custom Domain',
    description: 'Use your own domain name on any paid plan. Your brand, your URL — not ours. Build authority and trust with your audience.'
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: 'Lightning Fast',
    description: 'Your Vinelink page loads instantly on any device. No lag, no waiting — because every second counts when someone clicks your link.'
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: 'Set Up in 2 Minutes',
    description: 'Sign up, add your links, pick a theme, and share. No tech skills needed. You will be live before your coffee gets cold.'
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    title: 'Honest Pricing',
    description: 'Powerful features starting at just $4/mo — up to 6x cheaper than competitors. No surprise charges, no features locked behind paywalls.'
  }
]

function Features() {
  return (
    <section className="features" id="features">
      <div className="features__container">

        <div className="features__header">
          <div className="features__badge">Why Vinelink</div>
          <h2 className="features__title">Everything you need.<br />Nothing you don't.</h2>
          <p className="features__subtitle">
            We built the tool we always wished existed — simple, beautiful, and actually affordable.
          </p>
        </div>

        <div className="features__grid">
          {features.map((feature, index) => (
            <div className="features__card" key={index}>
              <div className="features__card-icon">
                {feature.icon}
              </div>
              <h3 className="features__card-title">{feature.title}</h3>
              <p className="features__card-description">{feature.description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default Features