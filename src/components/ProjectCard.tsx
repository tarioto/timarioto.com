import { ArrowUpRightIcon } from '../icons'
import styles from './ProjectCard.module.css'

export interface Project {
  title: string
  description: string
  url: string
}

export default function ProjectCard({ title, description, url }: Project) {
  return (
    <a className={styles.card} href={url} target="_blank" rel="noopener noreferrer">
      <span className={styles.title}>
        {title}
        <ArrowUpRightIcon className={styles.arrow} />
      </span>
      <p className={styles.description}>{description}</p>
    </a>
  )
}
