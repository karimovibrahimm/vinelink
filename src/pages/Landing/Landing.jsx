import { useEffect } from 'react'
import Hero from './sections/Hero'
import Features from './sections/Features'
import HowItWorks from './sections/HowItWorks'
import Pricing from './sections/Pricing'
import Testimonials from './sections/Testimonials'
import FooterCTA from './sections/FooterCTA'
import './Landing.css'

function Landing() {
  useEffect(() => {
    document.title = 'Vinelink — Your link-in-bio, built different'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.content = 'Create your free link-in-bio page in minutes. Share all your links, music, videos, and more from one beautiful page.'
  }, [])
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