import './WhyItsFree.css'

function WhyItsFree() {
  return (
    <section className="why-free" id="why-its-free">
      <div className="why-free__container">
        <div className="why-free__header">
          <h2>Why is Vinelink 100% Free?</h2>
          <p>We believe your digital identity shouldn't come with a monthly subscription.</p>
        </div>
        <div className="why-free__grid">
          <div className="why-free__card">
            <div className="why-free__icon">🔓</div>
            <h3>Open & Accessible</h3>
            <p>Unlike other platforms that charge for basic customization, we give you all the tools for free. Your profile, your rules.</p>
          </div>
          <div className="why-free__card">
            <div className="why-free__icon">🤝</div>
            <h3>Community Driven</h3>
            <p>Built by developers who were tired of paywalls. We focus on creating the best user experience, not the highest profit margins.</p>
          </div>
          <div className="why-free__card">
            <div className="why-free__icon">✨</div>
            <h3>No Hidden Fees</h3>
            <p>No premium tiers, no locked features. Everything you see—from analytics to AI tools—is included at zero cost.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WhyItsFree