import Hero from './sections/Hero'
import Features from './sections/Features'
import HowItWorks from './sections/HowItWorks'
import WhyItsFree from './sections/WhyItsFree' // <-- Replaced Pricing with WhyItsFree
import Testimonials from './sections/Testimonials'
import FooterCTA from './sections/FooterCTA'
import './Landing.css'

function Landing() {
  return (
    <main className="landing">
      <Hero />
      <Features />
      <HowItWorks />
      <WhyItsFree /> {/* <-- Renders the new section here */}
      <Testimonials />
      <FooterCTA />
    </main>
  )
}

export default Landing