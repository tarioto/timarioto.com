import { useEffect, useMemo, useRef } from 'react'
import './DaySky.css'
import { daySkyCssGradient } from '../lib/daySkyPalette'
import { createDaySkyScene, type DaySkyLabelId, type DaySkyScene } from '../lib/daySkyScene'
import { sunDay, sunPosition } from '../lib/sunPosition'
import { createRenderer } from '../lib/webglRenderer'

const PARALLAX_EASE = 0.06
const LABEL_EDGE_MARGIN_PX = 12

interface DaySkyProps {
  lat: number
  lon: number
  now: Date
}

const formatTime = (time: Date) => time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

/** The daytime sky in 3D: the day's sun path from sunrise to sunset, with the sun at its current height. */
export default function DaySky({ lat, lon, now }: DaySkyProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labelRefs = useRef<Partial<Record<DaySkyLabelId, HTMLElement | null>>>({})
  const sceneRef = useRef<DaySkyScene | null>(null)
  // Draws one frame; set once the renderer is up.
  const renderRef = useRef<() => void>(() => {})

  const day = useMemo(() => sunDay(now, lat, lon), [now, lat, lon])
  const sun = useMemo(() => ({ time: now, ...sunPosition(now, lat, lon) }), [now, lat, lon])
  const sunRef = useRef({ day, sun })
  sunRef.current = { day, sun }

  useEffect(() => {
    sceneRef.current?.setSun(day, sun)
    renderRef.current()
  }, [day, sun])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const renderer = createRenderer(canvas)
    // Without WebGL, the CSS gradient behind the canvas stands in for the sky.
    if (!renderer) return
    container.dataset.webgl = ''

    const sky = createDaySkyScene()
    sceneRef.current = sky
    sky.setSun(sunRef.current.day, sunRef.current.sun)

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

    let width = 0
    let height = 0
    let rafId = 0
    const target = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }

    function render() {
      renderer!.render(sky.scene, sky.camera)
      const positions = sky.labelPositions(width, height)
      for (const [id, label] of Object.entries(labelRefs.current)) {
        if (!label) continue
        const position = positions[id as DaySkyLabelId]
        let { x } = position
        // On narrow screens sunrise and sunset can fall past the edges; keep
        // their (centered) labels on screen anyway.
        if (id === 'rise' || id === 'set') {
          const half = label.offsetWidth / 2 + LABEL_EDGE_MARGIN_PX
          x = Math.min(width - half, Math.max(half, x))
        }
        label.style.transform = `translate(${x}px, ${position.y}px)`
        label.hidden = !position.visible
      }
    }
    renderRef.current = render

    function resize() {
      width = container!.clientWidth
      height = container!.clientHeight
      renderer!.setSize(width, height)
      sky.setSize(width, height)
      if (prefersReducedMotion) render()
    }

    function frame() {
      current.x += (target.x - current.x) * PARALLAX_EASE
      current.y += (target.y - current.y) * PARALLAX_EASE
      sky.setLook(current.x, current.y)
      render()
      rafId = requestAnimationFrame(frame)
    }

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType !== 'mouse') return
      target.x = (event.clientX / window.innerWidth) * 2 - 1
      target.y = (event.clientY / window.innerHeight) * 2 - 1
    }

    function handlePointerLeave() {
      target.x = 0
      target.y = 0
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    // As in the starfield, listen on the page: every section sits over this layer.
    const page = document.documentElement
    if (!prefersReducedMotion) {
      window.addEventListener('pointermove', handlePointerMove)
      page.addEventListener('pointerleave', handlePointerLeave)
      rafId = requestAnimationFrame(frame)
    }

    return () => {
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', handlePointerMove)
      page.removeEventListener('pointerleave', handlePointerLeave)
      renderRef.current = () => {}
      sceneRef.current = null
      sky.dispose()
      renderer.dispose()
    }
  }, [])

  const label = (id: DaySkyLabelId, className: string, text: string) => (
    <span
      key={id}
      ref={(element) => {
        labelRefs.current[id] = element
      }}
      className={`day-sky-label ${className}`}
      hidden
    >
      {text}
    </span>
  )

  return (
    <div
      ref={containerRef}
      className="day-sky"
      style={{ background: daySkyCssGradient(sun.altDeg) }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="day-sky-canvas" />
      {day.rise && label('rise', 'day-sky-label--event', `Sunrise ${formatTime(day.rise)}`)}
      {day.set && label('set', 'day-sky-label--event', `Sunset ${formatTime(day.set)}`)}
      {label(
        'noon',
        'day-sky-label--peak',
        `Peak ${Math.round(day.transit.altDeg)}° · ${formatTime(day.transit.time)}`,
      )}
      {label('sun', 'day-sky-label--sun', `${Math.round(sun.altDeg)}° now`)}
      {label('east', 'day-sky-label--compass', 'E')}
      {label('south', 'day-sky-label--compass', 'S')}
      {label('west', 'day-sky-label--compass', 'W')}
      {label('north', 'day-sky-label--compass', 'N')}
    </div>
  )
}
