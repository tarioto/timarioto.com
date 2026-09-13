import { useEffect, useRef } from 'react'
import styles from './HeroStarfield.module.css'
import { useVisitorSky } from '../hooks/useVisitorSky'
import { equatorialToHorizontal, projectToDome } from '../lib/skyPosition'
import { skyGradientForTemp } from '../lib/skyGradient'
import starsData from '../data/stars.json'
import constellationLinesData from '../data/constellationLines.json'

type StarTuple = [number, number, number] // [raDeg, decDeg, magnitude]
type LineSegment = [number, number][] // [raDeg, decDeg][]

const STARS = starsData as StarTuple[]
const CONSTELLATION_LINES = constellationLinesData as LineSegment[]

const SKY_UPDATE_INTERVAL_MS = 30_000
const PARALLAX_MAX_PX = 18
const PARALLAX_EASE = 0.06
const HOVER_RADIUS_PX = 150
const HOVER_EASE = 0.15
const HOVER_FADE_EASE = 0.12
const HOVER_HUE_SPEED_DEG_PER_SEC = 18

interface Star {
  ra: number
  dec: number
  mag: number
  twinklePhase: number
  twinkleSpeed: number
}

// Deterministic pseudo-random twinkle phase/speed per star, so the sky looks
// the same shape frame to frame without needing Math.random() bookkeeping.
const CATALOG: Star[] = STARS.map(([ra, dec, mag], i) => ({
  ra,
  dec,
  mag,
  twinklePhase: (((i * 9301 + 49297) % 233280) / 233280) * Math.PI * 2,
  twinkleSpeed: 0.5 + ((i * 104729) % 1000) / 1000,
}))

interface ProjectedStar {
  x: number
  y: number
  mag: number
  twinklePhase: number
  twinkleSpeed: number
}

interface ProjectedScene {
  stars: ProjectedStar[]
  lines: { x: number; y: number }[][]
}

function projectScene(lat: number, lon: number): ProjectedScene {
  const now = new Date()

  const stars: ProjectedStar[] = []
  for (const star of CATALOG) {
    const { altDeg, azDeg } = equatorialToHorizontal(star.ra, star.dec, lat, lon, now)
    if (altDeg <= 0) continue
    const point = projectToDome(altDeg, azDeg, 1)
    stars.push({ x: point.x, y: point.y, mag: star.mag, twinklePhase: star.twinklePhase, twinkleSpeed: star.twinkleSpeed })
  }

  const lines: { x: number; y: number }[][] = []
  for (const segment of CONSTELLATION_LINES) {
    const points: { x: number; y: number }[] = []
    let anyAboveHorizon = false
    for (const [ra, dec] of segment) {
      const { altDeg, azDeg } = equatorialToHorizontal(ra, dec, lat, lon, now)
      const point = projectToDome(altDeg, azDeg, 1)
      if (point.visible) anyAboveHorizon = true
      points.push({ x: point.x, y: point.y })
    }
    if (anyAboveHorizon) lines.push(points)
  }

  return { stars, lines }
}

export default function HeroStarfield() {
  const sky = useVisitorSky()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<ProjectedScene>({ stars: [], lines: [] })

  useEffect(() => {
    function update() {
      sceneRef.current = projectScene(sky.lat, sky.lon)
    }
    update()
    const interval = setInterval(update, SKY_UPDATE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [sky.lat, sky.lon])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    let width = 0
    let height = 0
    let rafId = 0
    const target = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }

    // Hover glow: a soft colored light that follows the cursor and brightens
    // nearby stars. Tracked separately from the parallax offset above since
    // it needs raw (unshifted) cursor position and its own fade in/out.
    const hoverTarget = { x: 0, y: 0 }
    const hoverCurrent = { x: 0, y: 0 }
    let hoverActive = false
    let hoverOpacity = 0

    function resize() {
      if (!container || !canvas) return
      width = container.clientWidth
      height = container.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      if (prefersReducedMotion) draw(0)
    }

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType !== 'mouse' || !container) return
      const rect = container.getBoundingClientRect()
      const nx = (event.clientX - rect.left) / rect.width - 0.5
      const ny = (event.clientY - rect.top) / rect.height - 0.5
      target.x = nx * PARALLAX_MAX_PX * 2
      target.y = ny * PARALLAX_MAX_PX * 2
      hoverTarget.x = event.clientX - rect.left
      hoverTarget.y = event.clientY - rect.top
      hoverActive = true
    }

    function handlePointerLeave() {
      target.x = 0
      target.y = 0
      hoverActive = false
    }

    function draw(timeMs: number) {
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx!.clearRect(0, 0, width, height)

      current.x += (target.x - current.x) * PARALLAX_EASE
      current.y += (target.y - current.y) * PARALLAX_EASE

      const cx = width / 2 + current.x
      const cy = height / 2 + current.y
      const domeRadius = Math.max(width, height) * 0.75

      ctx!.strokeStyle = 'rgba(255, 255, 255, 0.14)'
      ctx!.lineWidth = 1
      for (const segment of sceneRef.current.lines) {
        ctx!.beginPath()
        segment.forEach((point, i) => {
          const x = cx + point.x * domeRadius
          const y = cy + point.y * domeRadius
          if (i === 0) ctx!.moveTo(x, y)
          else ctx!.lineTo(x, y)
        })
        ctx!.stroke()
      }

      hoverCurrent.x += (hoverTarget.x - hoverCurrent.x) * HOVER_EASE
      hoverCurrent.y += (hoverTarget.y - hoverCurrent.y) * HOVER_EASE
      hoverOpacity += ((hoverActive ? 1 : 0) - hoverOpacity) * HOVER_FADE_EASE

      const hue = (timeMs / 1000) * HOVER_HUE_SPEED_DEG_PER_SEC

      const t = prefersReducedMotion ? 0 : timeMs / 1000
      for (const star of sceneRef.current.stars) {
        const x = cx + star.x * domeRadius
        const y = cy + star.y * domeRadius
        const size = Math.max(0.6, (5 - star.mag) * 0.45)
        const twinkle = prefersReducedMotion ? 1 : 0.65 + 0.35 * Math.sin(t * star.twinkleSpeed + star.twinklePhase)

        let hoverBoost = 0
        if (hoverOpacity > 0.01) {
          const dist = Math.hypot(x - hoverCurrent.x, y - hoverCurrent.y)
          if (dist < HOVER_RADIUS_PX) hoverBoost = (1 - dist / HOVER_RADIUS_PX) * hoverOpacity
        }

        const alpha = Math.min(1, twinkle + hoverBoost * 0.9)
        const drawSize = size + hoverBoost * 3

        ctx!.beginPath()
        ctx!.fillStyle =
          hoverBoost > 0.05 ? `hsla(${hue}, 90%, 82%, ${alpha})` : `rgba(255, 255, 255, ${alpha})`
        ctx!.arc(x, y, drawSize, 0, Math.PI * 2)
        ctx!.fill()
      }

      if (!prefersReducedMotion) rafId = requestAnimationFrame(draw)
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    // Listen on the hero itself, not just this (background) layer: the
    // headline/tagline/buttons render in a sibling on top of the canvas, so
    // pointer events over them would never reach a listener on `container`.
    const pointerTarget = container.parentElement ?? container

    if (!prefersReducedMotion) {
      pointerTarget.addEventListener('pointermove', handlePointerMove)
      pointerTarget.addEventListener('pointerleave', handlePointerLeave)
      rafId = requestAnimationFrame(draw)
    }

    return () => {
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      pointerTarget.removeEventListener('pointermove', handlePointerMove)
      pointerTarget.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

  const gradient = skyGradientForTemp(sky.status === 'loading' ? null : sky.tempC)

  return (
    <div ref={containerRef} className={styles.container} aria-hidden="true">
      <div className={styles.gradient} style={{ background: `linear-gradient(to bottom, ${gradient.top}, ${gradient.bottom})` }} />
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  )
}
