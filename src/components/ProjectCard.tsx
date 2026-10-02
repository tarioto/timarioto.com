import { ArrowUpRightIcon } from '../icons'
import './ProjectCard.css'
import GlassBacking from './GlassBacking'

export interface Project {
  title: string
  description: string
  url: string
}

export default function ProjectCard({ title, description, url }: Project) {
  return (
    <a className="project-card" href={url} target="_blank" rel="noopener noreferrer">
      <GlassBacking radius={12} />
      <span className="project-card-title">
        {title}
        <ArrowUpRightIcon className="project-card-arrow" />
      </span>
      <p className="project-card-description">{description}</p>
    </a>
  )
}
