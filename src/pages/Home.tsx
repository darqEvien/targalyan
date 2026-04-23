import { AboutSection } from '../components/burak/AboutSection'
import { BannerSection } from '../components/burak/BannerSection'
import { BurakFooter } from '../components/burak/BurakFooter'
import { BurakNav } from '../components/burak/BurakNav'
import { ContactSection } from '../components/burak/ContactSection'
import { CustomCursor } from '../components/burak/CustomCursor'
import { HeroSection } from '../components/burak/HeroSection'
import { ProjectsSection } from '../components/burak/ProjectsSection'

export function Home() {
  return (
    <>
      <CustomCursor />
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
