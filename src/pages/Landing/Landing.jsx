import Hero from './sections/Hero'
import Features from './sections/Features'
import HowItWorks from './sections/HowItWorks'
import Pricing from './sections/Pricing'
import Testimonials from './sections/Testimonials'
import FooterCTA from './sections/FooterCTA'
import './Landing.css'

function Landing() {
  return (
    <main className="landing">
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <FooterCTA />
    </main>
  )
}

export default Landing