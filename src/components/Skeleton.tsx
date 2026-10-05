import type { CSSProperties } from 'react'
import './Skeleton.css'

interface SkeletonProps {
  // Any CSS length; defaults to the full line.
  width?: CSSProperties['width']
}

// A shimmering placeholder for one line of text that hasn't loaded yet. Put
// it inside the element the text will fill, so it inherits that element's
// font size and line height and the loaded text takes up the same space.
export default function Skeleton({ width = '100%' }: SkeletonProps) {
  return <span className="skeleton skeleton-text" style={{ width }} aria-hidden="true" />
}
