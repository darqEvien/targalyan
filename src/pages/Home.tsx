import { AboutSection } from '../components/burak/AboutSection'
import { BannerSection } from '../components/burak/BannerSection'
import { BurakFooter } from '../components/burak/BurakFooter'
import { BurakNav } from '../components/burak/BurakNav'
import { ContactSection } from '../components/burak/ContactSection'
import { HeroSection } from '../components/burak/HeroSection'
import { ProjectsSection } from '../components/burak/ProjectsSection'

export function Home() {
  return (
    <>
      <BurakNav />
      <main>
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        <BannerSection />
        <ContactSection />
      </main>
      <BurakFooter />
    </>
  )
}
