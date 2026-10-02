import { ArrowUpRightIcon, GitHubIcon } from '../icons'
import './ProjectCard.css'
import GlassBacking from './GlassBacking'
import IconLink from './IconLink'

export interface Project {
  title: string
  description: string
  url: string
  repo: string
  screenshot: string
}

// The title link stretches over the whole card (see ProjectCard.css), so the
// card stays clickable without nesting the GitHub link inside another link.
export default function ProjectCard({ title, description, url, repo, screenshot }: Project) {
  return (
    <article className="project-card">
      <GlassBacking radius={12} />
      <img
        className="project-card-screenshot"
        src={screenshot}
        alt={`${title} screenshot`}
        width={960}
        height={600}
        loading="lazy"
      />
      <div className="project-card-body">
        <div className="project-card-header">
          <a className="project-card-title" href={url} target="_blank" rel="noopener noreferrer">
            <span className="project-card-title-text">
              {title}
              <ArrowUpRightIcon className="project-card-arrow" />
            </span>
          </a>
          <IconLink href={repo} label={`${title} on GitHub`} icon={<GitHubIcon />} />
        </div>
        <p className="project-card-description">{description}</p>
      </div>
    </article>
  )
}
