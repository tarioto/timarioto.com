import './ResumeSection.css'

interface ResumeSectionProps {
  resumeUrl: string
}

export default function ResumeSection({ resumeUrl }: ResumeSectionProps) {
  return (
    <section className="resume-section" aria-label="Resume">
      <h2 className="resume-section-title">Resume</h2>
      <div className="resume-section-body">
        <p className="resume-section-description">
          A quick overview of my experience — download the full PDF or view it inline.
        </p>
        <a className="resume-section-button" href={resumeUrl} download target="_blank" rel="noopener noreferrer">
          View Résumé
        </a>
      </div>
    </section>
  )
}
