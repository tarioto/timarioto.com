import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  CircleGeometry,
  Color,
  DataTexture,
  Fog,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
} from 'three'
import { Line2 } from 'three/addons/lines/Line2.js'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import { type DaySkyPalette, daySkyPalette } from './daySkyPalette'
import type { RGB } from './skyGradient'
import type { AltAz } from './skyPosition'
import type { SunDay } from './sunPosition'

const DEG_TO_RAD = Math.PI / 180

/** Radius of the sky dome the sun's path is drawn on, in world units. */
const DOME_RADIUS = 100
const SKY_RADIUS = 1000
const GROUND_RADIUS = 900

// The camera stands back from the dome and a little above the ground, so the
// whole arc, from a summer sunrise north of east round to a sunset north of
// west, fits on screen in perspective.
const CAMERA_HOME = new Vector3(0, 18, 230)
const CAMERA_TARGET = new Vector3(0, 62, -20)
const PARALLAX_RANGE = new Vector2(14, 7)
const HORIZONTAL_FOV_DEG = 66
const MIN_VERTICAL_FOV_DEG = 40
const MAX_VERTICAL_FOV_DEG = 100

const SUN_RADIUS = 3.2
const SUN_GLOW_SIZE = 18
const PATH_COLOR = new Color(1, 0.94, 0.82)

export type DaySkyLabelId = 'rise' | 'set' | 'noon' | 'sun' | 'east' | 'south' | 'west' | 'north'

interface ScreenPoint {
  x: number
  y: number
  visible: boolean
}

/**
 * A point on the dome, in world space. The scene is turned so the sun's
 * highest point (south of the observer in the northern hemisphere, north in
 * the southern) is straight ahead, down -z, with east on the left when
 * facing south, as it is in the real sky.
 */
export function domePoint(altDeg: number, azDeg: number, frontAzDeg: number, radius = DOME_RADIUS): Vector3 {
  const alt = altDeg * DEG_TO_RAD
  const az = (azDeg - frontAzDeg) * DEG_TO_RAD
  return new Vector3(
    radius * Math.cos(alt) * Math.sin(az),
    radius * Math.sin(alt),
    -radius * Math.cos(alt) * Math.cos(az),
  )
}

/** Vertical field of view that keeps a fixed horizontal one on screen, within limits for tall or very wide screens. */
export function verticalFovForAspect(aspect: number): number {
  const vertical = (2 * Math.atan(Math.tan((HORIZONTAL_FOV_DEG / 2) * DEG_TO_RAD) / aspect)) / DEG_TO_RAD
  return Math.min(MAX_VERTICAL_FOV_DEG, Math.max(MIN_VERTICAL_FOV_DEG, vertical))
}

function srgb([r, g, b]: RGB): Color {
  return new Color().setRGB(r / 255, g / 255, b / 255, SRGBColorSpace)
}

// The sky is painted on the inside of a big sphere: a gradient from the
// horizon to the zenith and a halo around the sun.
const SKY_VERTEX_SHADER = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const SKY_FRAGMENT_SHADER = `
  uniform vec3 zenith;
  uniform vec3 horizon;
  uniform vec3 glow;
  uniform vec3 sunDirection;
  varying vec3 vWorldPosition;
  void main() {
    vec3 dir = normalize(vWorldPosition - cameraPosition);
    float height = max(dir.y, 0.0);
    vec3 sky = mix(horizon, zenith, pow(height, 0.55));
    float toSun = max(dot(dir, sunDirection), 0.0);
    // A wide warm wash low on the sun's side, and a tight halo.
    float horizonWash = pow(toSun, 4.0) * pow(1.0 - height, 3.0) * 0.35;
    float halo = pow(toSun, 90.0) * 0.2 + pow(toSun, 1200.0) * 0.35;
    sky += glow * (horizonWash + halo);
    // Below the horizon is the far ground, lost in the same haze as the fog.
    gl_FragColor = vec4(dir.y < 0.0 ? horizon : sky, 1.0);
    #include <colorspace_fragment>
  }
`

/** A soft round glow, built in memory so it needs no image or 2D canvas. */
function glowTexture(): DataTexture {
  const size = 64
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const distance = Math.hypot(x - size / 2 + 0.5, y - size / 2 + 0.5) / (size / 2)
      const alpha = Math.max(0, 1 - distance) ** 2.2
      const i = (y * size + x) * 4
      data.set([255, 255, 255, Math.round(alpha * 255)], i)
    }
  }
  const texture = new DataTexture(data, size, size)
  texture.needsUpdate = true
  return texture
}

function circlePoints(altDeg: number, segments: number): Vector3[] {
  const points: Vector3[] = []
  for (let i = 0; i <= segments; i++) points.push(domePoint(altDeg, (i / segments) * 360, 0))
  return points
}

function fatLine(options: { dashed: boolean; width: number; opacity: number }): Line2 {
  const material = new LineMaterial({
    color: PATH_COLOR,
    linewidth: options.width,
    transparent: true,
    opacity: options.opacity,
    dashed: options.dashed,
    fog: false,
    dashSize: 3,
    gapSize: 3,
  })
  const line = new Line2(new LineGeometry(), material)
  line.visible = false
  return line
}

/** Points the line through `points`, hiding it when there aren't enough to draw. */
function setLinePoints(line: Line2, points: Vector3[]) {
  line.visible = points.length >= 2
  if (!line.visible) return
  line.geometry.dispose()
  line.geometry = new LineGeometry().setPositions(points.flatMap((point) => [point.x, point.y, point.z]))
  line.computeLineDistances()
}

export interface DaySkyScene {
  scene: Scene
  camera: PerspectiveCamera
  /** Fits the camera and line widths to a canvas of this CSS size. */
  setSize(width: number, height: number): void
  /** Places the sun and its path for a day, with the sun at `now`. */
  setSun(day: SunDay, now: AltAz & { time: Date }): void
  /** Shifts the camera for parallax; each axis runs from -1 to 1. */
  setLook(x: number, y: number): void
  /** Where each label's anchor lands on a canvas of this CSS size. */
  labelPositions(width: number, height: number): Record<DaySkyLabelId, ScreenPoint>
  dispose(): void
}

/** Builds the daytime sky: a dome with the day's sun path across it, the sun at its current height, over a ground plane. */
export function createDaySkyScene(): DaySkyScene {
  const scene = new Scene()
  // The ground fades into the horizon's haze with distance.
  const fog = new Fog(0xffffff, 150, GROUND_RADIUS)
  scene.fog = fog
  const camera = new PerspectiveCamera(50, 1, 1, SKY_RADIUS * 2)
  camera.position.copy(CAMERA_HOME)
  camera.lookAt(CAMERA_TARGET)

  const skyMaterial = new ShaderMaterial({
    vertexShader: SKY_VERTEX_SHADER,
    fragmentShader: SKY_FRAGMENT_SHADER,
    side: BackSide,
    depthWrite: false,
    uniforms: {
      zenith: { value: new Color() },
      horizon: { value: new Color() },
      glow: { value: new Color() },
      sunDirection: { value: new Vector3(0, 1, 0) },
    },
  })
  const sky = new Mesh(new SphereGeometry(SKY_RADIUS, 48, 24), skyMaterial)
  sky.renderOrder = -1
  scene.add(sky)

  const groundMaterial = new MeshBasicMaterial()
  const ground = new Mesh(new CircleGeometry(GROUND_RADIUS, 96), groundMaterial)
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  // Faint guides that give the dome its shape: the horizon ring, and rings
  // at 30° and 60° up.
  const guideMaterial = new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16 })
  const faintGuideMaterial = new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 })
  const horizonRing = new Line(new BufferGeometry().setFromPoints(circlePoints(0.05, 128)), guideMaterial)
  scene.add(horizonRing)
  for (const altDeg of [30, 60]) {
    scene.add(new Line(new BufferGeometry().setFromPoints(circlePoints(altDeg, 96)), faintGuideMaterial))
  }

  const pastPath = fatLine({ dashed: false, width: 2.5, opacity: 0.85 })
  const futurePath = fatLine({ dashed: true, width: 2, opacity: 0.55 })
  const heightGuide = fatLine({ dashed: true, width: 1.25, opacity: 0.45 })
  scene.add(pastPath, futurePath, heightGuide)

  const markerMaterial = new MeshBasicMaterial({ color: PATH_COLOR, fog: false })
  const markerGeometry = new SphereGeometry(1.4, 16, 8)
  const riseMarker = new Mesh(markerGeometry, markerMaterial)
  const setMarker = new Mesh(markerGeometry, markerMaterial)
  const noonMarker = new Mesh(markerGeometry, markerMaterial)
  scene.add(riseMarker, setMarker, noonMarker)

  const sunMaterial = new MeshBasicMaterial({ fog: false })
  const sun = new Mesh(new SphereGeometry(SUN_RADIUS, 32, 16), sunMaterial)
  const glowMap = glowTexture()
  const sunGlowMaterial = new SpriteMaterial({
    map: glowMap,
    blending: AdditiveBlending,
    depthWrite: false,
    opacity: 0.55,
    fog: false,
  })
  const sunGlow = new Sprite(sunGlowMaterial)
  sunGlow.scale.setScalar(SUN_GLOW_SIZE)
  sun.add(sunGlow)
  scene.add(sun)

  const anchors: Record<DaySkyLabelId, Vector3> = {
    rise: new Vector3(),
    set: new Vector3(),
    noon: new Vector3(),
    sun: new Vector3(),
    east: new Vector3(),
    south: new Vector3(),
    west: new Vector3(),
    north: new Vector3(),
  }
  const visibleAnchors = new Set<DaySkyLabelId>()

  function applyPalette(palette: DaySkyPalette) {
    const uniforms = skyMaterial.uniforms
    uniforms.zenith.value.copy(srgb(palette.zenith))
    uniforms.horizon.value.copy(srgb(palette.horizon))
    uniforms.glow.value.copy(srgb(palette.glow))
    fog.color.copy(srgb(palette.horizon))
    groundMaterial.color.copy(srgb(palette.ground))
    sunMaterial.color.copy(srgb(palette.glow)).lerp(new Color(1, 1, 1), 0.6)
    sunGlowMaterial.color.copy(srgb(palette.glow))
  }

  // Aims the sky's sun halo from the camera's eye to the sun on the dome, so
  // the halo stays centered on it as the camera drifts.
  function aimHalo() {
    skyMaterial.uniforms.sunDirection.value.copy(sun.position).sub(camera.position).normalize()
  }

  return {
    scene,
    camera,

    setSize(width, height) {
      camera.aspect = width / height
      camera.fov = verticalFovForAspect(camera.aspect)
      camera.updateProjectionMatrix()
      for (const line of [pastPath, futurePath, heightGuide]) line.material.resolution.set(width, height)
    },

    setSun(day, now) {
      const frontAzDeg = day.transit.azDeg
      // Keep the path's ends on the horizon rather than just under it.
      const toWorld = (point: AltAz) => domePoint(Math.max(0, point.altDeg), point.azDeg, frontAzDeg)

      const nowMs = now.time.getTime()
      const sunPoint = domePoint(now.altDeg, now.azDeg, frontAzDeg)
      const past = day.path.filter((point) => point.time.getTime() < nowMs).map(toWorld)
      const future = day.path.filter((point) => point.time.getTime() > nowMs).map(toWorld)
      const sunUp = now.altDeg > 0
      // Join both halves of the path at the sun while it's up.
      setLinePoints(pastPath, sunUp && past.length > 0 ? [...past, sunPoint] : past)
      setLinePoints(futurePath, sunUp && future.length > 0 ? [sunPoint, ...future] : future)
      setLinePoints(heightGuide, sunUp ? [sunPoint, new Vector3(sunPoint.x, 0, sunPoint.z)] : [])

      sun.position.copy(sunPoint)
      sun.visible = sunUp

      visibleAnchors.clear()
      if (sunUp) visibleAnchors.add('sun')
      anchors.sun.copy(sunPoint)

      for (const [id, time, marker] of [
        ['rise', day.rise, riseMarker],
        ['set', day.set, setMarker],
      ] as const) {
        const point = time && day.path.find((sample) => sample.time.getTime() === time.getTime())
        marker.visible = Boolean(point)
        if (!point) continue
        marker.position.copy(toWorld(point))
        anchors[id].copy(marker.position)
        visibleAnchors.add(id)
      }

      noonMarker.visible = day.transit.altDeg > 0
      noonMarker.position.copy(domePoint(day.transit.altDeg, day.transit.azDeg, frontAzDeg))
      anchors.noon.copy(noonMarker.position)
      if (noonMarker.visible) visibleAnchors.add('noon')

      for (const [id, azDeg] of [
        ['north', 0],
        ['east', 90],
        ['south', 180],
        ['west', 270],
      ] as const) {
        anchors[id].copy(domePoint(0, azDeg, frontAzDeg))
        visibleAnchors.add(id)
      }

      applyPalette(daySkyPalette(now.altDeg))
      aimHalo()
    },

    setLook(x, y) {
      camera.position.set(CAMERA_HOME.x + x * PARALLAX_RANGE.x, CAMERA_HOME.y - y * PARALLAX_RANGE.y, CAMERA_HOME.z)
      camera.lookAt(CAMERA_TARGET)
      aimHalo()
    },

    labelPositions(width, height) {
      camera.updateMatrixWorld()
      const positions = {} as Record<DaySkyLabelId, ScreenPoint>
      for (const id of Object.keys(anchors) as DaySkyLabelId[]) {
        const projected = anchors[id].clone().project(camera)
        positions[id] = {
          x: ((projected.x + 1) / 2) * width,
          y: ((1 - projected.y) / 2) * height,
          // Beyond the far plane or behind the camera, z leaves [-1, 1].
          visible: visibleAnchors.has(id) && Math.abs(projected.z) <= 1,
        }
      }
      return positions
    },

    dispose() {
      scene.traverse((object) => {
        if (object instanceof Mesh || object instanceof Line) {
          object.geometry.dispose()
          object.material.dispose()
        }
      })
      sunGlowMaterial.dispose()
      glowMap.dispose()
    },
  }
}
