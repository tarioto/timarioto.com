import ProjectCard, { type Project } from './ProjectCard'
import './ProjectsSection.css'
import PageSection from './PageSection'

interface ProjectsSectionProps {
  projects: Project[]
}

export default function ProjectsSection({ projects }: ProjectsSectionProps) {
  return (
    <PageSection className="projects-section" title="Projects">
      <div className="projects-section-grid">
        {projects.map((project) => (
          <ProjectCard key={project.url} {...project} />
        ))}
      </div>
    </PageSection>
  )
}
