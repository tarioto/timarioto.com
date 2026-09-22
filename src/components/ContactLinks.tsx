import { GitHubIcon, InstagramIcon, LinkedInIcon, MailIcon } from '../icons'
import IconLink from './IconLink'
import './ContactLinks.css'

export interface ContactInfo {
  email: string
  linkedin: string
  github: string
  instagram?: string
}

export default function ContactLinks({ email, linkedin, github, instagram }: ContactInfo) {
  return (
    <div className="contact-links-row">
      <IconLink href={`mailto:${email}`} label="Email" icon={<MailIcon />} external={false} />
      <IconLink href={linkedin} label="LinkedIn profile" icon={<LinkedInIcon />} />
      <IconLink href={github} label="GitHub profile" icon={<GitHubIcon />} />
      {instagram && <IconLink href={instagram} label="Instagram profile" icon={<InstagramIcon />} />}
    </div>
  )
}
