/* Landing Page Redesign — Modern, CRO-focused design */

import HeroSection from './components/landing/HeroSection'
import TrustBadges from './components/landing/TrustBadges'
import HowItWorks from './components/landing/HowItWorks'
import FeaturesGrid from './components/landing/FeaturesGrid'
import CTASection from './components/landing/CTASection'
import Footer from './components/landing/Footer'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <HeroSection />
      <TrustBadges />
      <HowItWorks />
      <FeaturesGrid />
      <CTASection />
      <Footer />
    </main>
  )
}
