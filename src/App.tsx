import Bento from './components/Bento'
import type { ContactInfo } from './components/ContactLinks'
import CurrentlyListeningSection from './components/CurrentlyListeningSection'
import CurrentlyWatchingSection from './components/CurrentlyWatchingSection'
import Footer from './components/Footer'
import Hero from './components/Hero'
import type { Project } from './components/ProjectCard'
import ProjectsSection from './components/ProjectsSection'
import Starfield from './components/Starfield'
import WeatherSection from './components/WeatherSection'

const NAME = 'Tim Arioto'

const contact: ContactInfo = {
  email: 'timarioto@gmail.com',
  linkedin: 'https://linkedin.com/in/timarioto',
  github: 'https://github.com/tarioto',
  instagram: 'https://instagram.com/tarioto',
}

const projects: Project[] = [
  {
    title: 'WearToday',
    description: "iOS app that tells you what to wear and bring for the day's weather, using Apple's on-device AI.",
    // An iOS app with no website, so the card links to the repo too.
    url: 'https://github.com/tarioto/WearToday',
    repo: 'https://github.com/tarioto/WearToday',
    screenshot: '/projects/weartoday.jpg',
  },
  {
    title: 'Winchester Storage',
    description: 'Website for an RV and boat storage facility in Reno, NV.',
    url: 'https://winchesterrvandboatstorage.com',
    repo: 'https://github.com/tarioto/winchester-storage',
    screenshot: '/projects/winchester-storage.jpg',
  },
  {
    title: 'timarioto.com',
    description: 'This site: React and Bun on S3 and CloudFront, with live data from Lambda pollers.',
    url: 'https://timarioto.com',
    repo: 'https://github.com/tarioto/timarioto.com',
    screenshot: '/projects/timarioto.jpg',
  },
  {
    title: 'VIZRISK',
    description: 'Risk visualization tool.',
    url: 'https://vizrisk.timarioto.com',
    repo: 'https://github.com/tarioto/vizrisk',
    screenshot: '/projects/vizrisk.jpg',
  },
]

export default function App() {
  return (
    <>
      <Starfield />
      <Bento
        main={
          <>
            <Hero name={NAME} tagline="Software engineer building products end-to-end." {...contact} />
            <ProjectsSection projects={projects} />
          </>
        }
        side={
          <>
            <WeatherSection />
            <CurrentlyListeningSection />
            <CurrentlyWatchingSection />
          </>
        }
        footer={<Footer name={NAME} year={new Date().getFullYear()} />}
      />
    </>
  )
}
