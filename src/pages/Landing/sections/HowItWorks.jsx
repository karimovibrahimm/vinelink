import './HowItWorks.css'

const steps = [
  {
    number: '01',
    emoji: '✍️',
    title: 'Create your account',
    description: 'Sign up for free in seconds. No credit card required. Just your email and you are ready to go.'
  },
  {
    number: '02',
    emoji: '🎨',
    title: 'Customize your page',
    description: 'Pick a template, add your links, upload your photo, and make it yours. It takes less than 2 minutes.'
  },
  {
    number: '03',
    emoji: '🚀',
    title: 'Share your link',
    description: 'Drop your Vinelink URL in your Instagram bio and watch your audience find everything you do in one place.'
  }
]

function HowItWorks() {
  return (
    <section className="howitworks" id="how-it-works">
      <div className="howitworks__container">

        <div className="howitworks__header">
          <div className="howitworks__badge">How it works</div>
          <h2 className="howitworks__title">Up and running<br />in 2 minutes flat.</h2>
          <p className="howitworks__subtitle">
            No tutorials, no tech headaches. Just three simple steps and your page is live.
          </p>
        </div>

        <div className="howitworks__steps">
          {steps.map((step, index) => (
            <>
              <div className="howitworks__step-card" key={index}>
                <div className="howitworks__step-number">{step.number}</div>
                <div className="howitworks__step-emoji">{step.emoji}</div>
                <h3 className="howitworks__step-title">{step.title}</h3>
                <p className="howitworks__step-description">{step.description}</p>
              </div>

              {index < steps.length - 1 && (
                <div className="howitworks__connector">
                  <div className="howitworks__connector-line"></div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              )}
            </>
          ))}
        </div>

        <div className="howitworks__cta">
          <a href="/signup" className="howitworks__cta-btn">
            All features for free — Start now
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>

      </div>
    </section>
  )
}

export default HowItWorks