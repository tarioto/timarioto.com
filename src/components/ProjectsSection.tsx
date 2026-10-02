import ProjectCard, { type Project } from './ProjectCard'
import './ProjectsSection.css'
import PageGlass from './PageGlass'

interface ProjectsSectionProps {
  projects: Project[]
}

export default function ProjectsSection({ projects }: ProjectsSectionProps) {
  return (
    <section className="projects-section page-section" aria-label="Projects">
      <PageGlass />
      <h2 className="projects-section-title">Projects</h2>
      <div className="projects-section-grid">
        {projects.map((project) => (
          <ProjectCard key={project.url} {...project} />
        ))}
      </div>
    </section>
  )
}
