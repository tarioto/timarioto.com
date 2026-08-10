import ProjectCard, { type Project } from './ProjectCard'
import styles from './ProjectsSection.module.css'

interface ProjectsSectionProps {
  projects: Project[]
}

export default function ProjectsSection({ projects }: ProjectsSectionProps) {
  return (
    <section className={styles.section} aria-label="Projects">
      <h2 className={styles.title}>Projects</h2>
      <div className={styles.grid}>
        {projects.map((project) => (
          <ProjectCard key={project.url} {...project} />
        ))}
      </div>
    </section>
  )
}
