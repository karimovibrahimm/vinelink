import { useState } from 'react'
import './Pricing.css'

const plans = [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started.',
    cta: 'Get started free',
    popular: false,
    features: [
      'Up to 5 links',
      'Basic themes',
      'Vinelink subdomain',
      'Basic analytics',
      'Mobile optimized',
    ],
    missing: [
      'Custom domain',
      'Advanced analytics',
      'Remove Vinelink branding',
      'Priority support',
    ]
  },
  {
    name: 'Pro',
    price: 4,
    description: 'For creators who are serious about growth.',
    cta: 'Start Pro free for 7 days',
    popular: true,
    features: [
      'Unlimited links',
      'All premium themes',
      'Custom domain support',
      'Advanced analytics',
      'Remove Vinelink branding',
      'Social media icons',
      'Email support',
    ],
    missing: [
      'Priority support',
    ]
  },
  {
    name: 'Business',
    price: 9,
    description: 'For brands and teams that need more.',
    cta: 'Start Business free for 7 days',
    popular: false,
    features: [
      'Everything in Pro',
      'Multiple team members',
      'Priority support',
      'Custom analytics reports',
      'Early access to new features',
      'Dedicated account manager',
      'Custom integrations',
    ],
    missing: []
  }
]

function Pricing() {
  const [yearly, setYearly] = useState(false)

  return (
    <section className="pricing" id="pricing">
      <div className="pricing__container">

        <div className="pricing__header">
          <div className="pricing__badge">Pricing</div>
          <h2 className="pricing__title">Simple, honest pricing.<br />No surprises.</h2>
          <p className="pricing__subtitle">
            Up to 6x cheaper than Linktree. Cancel anytime, no questions asked.
          </p>

          <div className="pricing__toggle">
            <span className={!yearly ? 'pricing__toggle-label--active' : 'pricing__toggle-label'}>
              Monthly
            </span>
            <div
              className={`pricing__toggle-switch ${yearly ? 'pricing__toggle-switch--on' : ''}`}
              onClick={() => setYearly(!yearly)}
            >
              <div className="pricing__toggle-knob"></div>
            </div>
            <span className={yearly ? 'pricing__toggle-label--active' : 'pricing__toggle-label'}>
              Yearly
              <span className="pricing__toggle-save">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="pricing__grid">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`pricing__card ${plan.popular ? 'pricing__card--popular' : ''}`}
            >
              {plan.popular && (
                <div className="pricing__popular-badge">⭐ Most Popular</div>
              )}

              <div className="pricing__plan-name">{plan.name}</div>

              <div className="pricing__price">
                <span className="pricing__currency">$</span>
                <span className="pricing__amount">
                  {yearly ? Math.floor(plan.price * 0.8) : plan.price}
                </span>
                <span className="pricing__period">/mo</span>
              </div>

              {yearly && plan.price > 0 && (
                <div className="pricing__billed">billed yearly</div>
              )}

              <p className="pricing__plan-description">{plan.description}</p>

              <a
                href="/signup"
                className={`pricing__cta ${plan.popular ? 'pricing__cta--popular' : ''}`}
              >
                {plan.cta}
              </a>

              <div className="pricing__divider"></div>

              <ul className="pricing__features">
                {plan.features.map((feature, i) => (
                  <li key={i} className="pricing__feature pricing__feature--included">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {feature}
                  </li>
                ))}
                {plan.missing.map((feature, i) => (
                  <li key={i} className="pricing__feature pricing__feature--missing">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="pricing__note">
          🔒 Secure payments. Cancel anytime. All plans include a 7-day free trial.
        </p>

      </div>
    </section>
  )
}

export default Pricing