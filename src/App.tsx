import ContactSection from './components/ContactSection'
import CurrentlyWatchingSection from './components/CurrentlyWatchingSection'
import Footer from './components/Footer'
import Hero from './components/Hero'
import ProjectsSection from './components/ProjectsSection'
import ResumeSection from './components/ResumeSection'
import type { Project } from './components/ProjectCard'
import type { ContactInfo } from './components/ContactLinks'

const NAME = 'Tim Arioto'
const RESUME_URL = '/resume.pdf'

const contact: ContactInfo = {
  email: 'timarioto@gmail.com',
  linkedin: 'https://linkedin.com/in/timarioto',
  github: 'https://github.com/tarioto',
  instagram: 'https://instagram.com/tarioto',
}

const projects: Project[] = [
  {
    title: 'VIZRISK',
    description: 'Risk visualization tool.',
    url: 'https://vizrisk.timarioto.com',
  },
]

export default function App() {
  return (
    <>
      <Hero name={NAME} tagline="Software engineer building products end-to-end." resumeUrl={RESUME_URL} />
      <main>
        <ResumeSection resumeUrl={RESUME_URL} />
        <ProjectsSection projects={projects} />
        <CurrentlyWatchingSection />
        <ContactSection {...contact} />
      </main>
      <Footer name={NAME} year={new Date().getFullYear()} {...contact} />
    </>
  )
}
