import Hero from '@/components/home/Hero'
import Features from '@/components/home/Features'
import TrackingSection from '@/components/home/TrackingSection'
import ReportingCTA from '@/components/home/ReportingCTA'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <TrackingSection />
      <ReportingCTA />
    </main>
  )
}