import { useJson } from '../hooks/useJson'
import MediaCard, { MediaCardSkeleton } from './MediaCard'
import PageSection from './PageSection'

interface MonthlyPick {
  updatedAt: string
  month: string
  title: string
  artist: string | null
  artworkUrl: string | null
  url: string
  playCount: number | null
}

export function playsDescription(artist: string | null, playCount: number | null) {
  const plays = playCount ? `${playCount} play${playCount === 1 ? '' : 's'}` : null
  return [artist, plays].filter(Boolean).join(' · ') || null
}

function PickCard({ pick, kicker }: { pick: MonthlyPick; kicker: string }) {
  return (
    <MediaCard
      href={pick.url}
      imageSrc={pick.artworkUrl}
      aspect="square"
      fallback="🎧"
      kicker={kicker}
      title={pick.title}
      description={playsDescription(pick.artist, pick.playCount)}
    />
  )
}

export default function CurrentlyListeningSection() {
  const song = useJson<MonthlyPick>('/song.json')
  const album = useJson<MonthlyPick>('/album.json')

  // Hold the placeholder until both have settled, so a late album doesn't
  // shift the song card once it's showing.
  if (song.loading || album.loading) {
    return (
      <PageSection className="currently-listening-section" title="Currently Listening" aria-busy="true">
        <div className="media-card-list">
          <MediaCardSkeleton aspect="square" description />
          <MediaCardSkeleton aspect="square" description />
        </div>
      </PageSection>
    )
  }

  if (!song.data && !album.data) return null

  return (
    <PageSection className="currently-listening-section" title="Currently Listening">
      <div className="media-card-list">
        {song.data && <PickCard pick={song.data} kicker="Song of the month" />}
        {album.data && <PickCard pick={album.data} kicker="Album of the month" />}
      </div>
    </PageSection>
  )
}
