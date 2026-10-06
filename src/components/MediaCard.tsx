import { useState } from 'react'
import { ArrowUpRightIcon } from '../icons'
import GlassBacking from './GlassBacking'
import GlassCard from './GlassCard'
import './MediaCard.css'
import Skeleton from './Skeleton'

interface MediaCardProps {
  href: string
  imageSrc: string | null
  // Square album artwork or a 2:3 poster.
  aspect: 'square' | 'poster'
  // Emoji shown when there's no image, or it fails to load.
  fallback: string
  kicker: string
  title: string
  description?: string | null
}

const imageSize = {
  square: { width: 600, height: 600 },
  poster: { width: 342, height: 513 },
}

function Thumbnail({ src, aspect, fallback }: Pick<MediaCardProps, 'aspect' | 'fallback'> & { src: string | null }) {
  const [failed, setFailed] = useState(false)
  const className = `media-card-image media-card-image-${aspect}`

  if (!src || failed) {
    return (
      <div className={`${className} media-card-image-fallback`} aria-hidden="true">
        {fallback}
      </div>
    )
  }

  return <img className={className} src={src} alt="" {...imageSize[aspect]} onError={() => setFailed(true)} />
}

// A linked row for a piece of media: its artwork as a thumbnail, then a
// kicker, title and optional description on glass.
export default function MediaCard({ href, imageSrc, aspect, fallback, kicker, title, description }: MediaCardProps) {
  return (
    <GlassCard
      href={href}
      media={<Thumbnail src={imageSrc} aspect={aspect} fallback={fallback} />}
      backdropSrc={imageSrc}
    >
      <span className="media-card-kicker">{kicker}</span>
      <span className="media-card-title">
        <span className="media-card-title-text">{title}</span>
        <ArrowUpRightIcon className="media-card-arrow" />
      </span>
      {description && <p className="media-card-description">{description}</p>}
    </GlassCard>
  )
}

// A MediaCard's placeholder while its data loads, built from the same classes
// so it takes up the same space.
export function MediaCardSkeleton({ aspect, description }: Pick<MediaCardProps, 'aspect'> & { description?: boolean }) {
  return (
    <div className="glass-card" aria-hidden="true">
      <div className="glass-card-media">
        <div className={`media-card-image media-card-image-${aspect} skeleton`} />
      </div>
      <div className="glass-card-panel">
        <GlassBacking radius={0} />
        <div className="glass-card-body">
          <span className="media-card-kicker">
            <Skeleton width="55%" />
          </span>
          <span className="media-card-title">
            <Skeleton width="75%" />
          </span>
          {description && (
            <p className="media-card-description">
              <Skeleton width="60%" />
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
