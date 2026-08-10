import styles from './ResumeSection.module.css'

interface ResumeSectionProps {
  resumeUrl: string
}

export default function ResumeSection({ resumeUrl }: ResumeSectionProps) {
  return (
    <section className={styles.section} aria-label="Resume">
      <h2 className={styles.title}>Resume</h2>
      <div className={styles.body}>
        <p className={styles.description}>
          A quick overview of my experience — download the full PDF or view it inline.
        </p>
        <a className={styles.button} href={resumeUrl} download target="_blank" rel="noopener noreferrer">
          View Résumé
        </a>
      </div>
    </section>
  )
}
