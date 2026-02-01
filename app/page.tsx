/* Landing Page Redesign — Premium, Modern, Dark Theme */

import HeroSection from './components/landing/HeroSection'
import FeaturesGrid from './components/landing/FeaturesGrid'
import HowItWorks from './components/landing/HowItWorks'
import CTASection from './components/landing/CTASection'
import Footer from './components/landing/Footer'
import Navbar from './components/landing/Navbar'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      {/* Gradient ornamentation */}
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 mx-auto h-[600px] max-w-5xl bg-gradient-to-b from-cyan-500/20 via-slate-900 to-transparent blur-3xl" />
      
      <Navbar />
      <HeroSection />
      <FeaturesGrid />
      <HowItWorks />
      <CTASection />
      <Footer />
    </main>
  )
}
