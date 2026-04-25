import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getCycleState, smoothstep } from '../buildCycle'

const ACCENT = '#e4cf98'
const ACCENT_SOFT = '#c4a86a'
const ACCENT_DIM = '#8f784d'
const STEEL = '#5a554c'
const STEEL_BRIGHT = '#8a8274'
const GRID = '#1e1c19'
const GRID_ACCENT = '#2a2722'
const GHOST = '#3d3830'

const FLOORS = 12
const FLOOR_H = 0.5
const BASE_RX = 1.05
const BASE_RZ = 0.82
const INNER_SCALE = 0.34
const SLAB_SEGMENTS = 80
const MERIDIANS = 22
const MULLIONS = 28
/** Superellipse exponent — higher = squarer; ~3.3 reads as a soft “house” oval. */
const HOUSE_EXP = 3.35
/** Nearly rectangular with generous corner radii (garage / wing). */
const BOX_EXP = 5.4

function setLineOpacity(obj: THREE.Object3D | null, opacity: number, mul = 1) {
  if (!obj) return
  const o = Math.min(1, Math.max(0, opacity)) * mul
  obj.traverse((ch) => {
    const m = (ch as THREE.Line | THREE.LineSegments | THREE.LineLoop).material as
      | THREE.LineBasicMaterial
      | undefined
    if (m && 'opacity' in m) {
      m.opacity = o
      m.transparent = true
    }
  })
}

function floorPartOpacity(
  floor: number,
  completeness: number,
): {
  slab: number
  cornice: number
  core: number
  meridian: number
  facade: number
  brace: number
  band: number
  joist: number
  bay: number
  tie: number
  kbrace: number
  belt: number
} {
  const n = FLOORS
  const wave = completeness * (n + 0.64) + 0.06
  const f0 = floor * 0.9
  const slab = smoothstep(f0 + 0.02, f0 + 0.3, wave)
  const cornice = smoothstep(f0 + 0.04, f0 + 0.34, wave)
  const core = smoothstep(f0 + 0.1, f0 + 0.4, wave)
  const meridian = smoothstep(f0 + 0.16, f0 + 0.5, wave)
  const facade = smoothstep(f0 + 0.2, f0 + 0.56, wave)
  const brace = smoothstep(f0 + 0.34, f0 + 0.78, wave)
  const band = smoothstep(f0 + 0.44, f0 + 0.88, wave)
  const belt = smoothstep(f0 + 0.1, f0 + 0.48, wave)
  const joist = smoothstep(f0 + 0.22, f0 + 0.54, wave)
  const bay = smoothstep(f0 + 0.26, f0 + 0.62, wave)
  const tie = smoothstep(f0 + 0.4, f0 + 0.84, wave)
  const kbrace = smoothstep(f0 + 0.3, f0 + 0.74, wave)
  const settle = smoothstep(0.86, 1, completeness)
  const breathe = 0.022 * Math.sin(settle * Math.PI * 2.02)
  return {
    slab: Math.min(1, slab * (1 + breathe)),
    cornice: cornice * (0.95 + 0.05 * settle),
    core: core * (0.92 + 0.08 * settle),
    meridian: meridian * (0.92 + 0.08 * settle),
    facade: facade * (0.88 + 0.12 * settle),
    brace: brace * (0.9 + 0.1 * settle),
    band: band * (0.87 + 0.13 * settle),
    belt: belt * (0.82 + 0.18 * settle),
    joist: joist * (0.84 + 0.16 * settle),
    bay: bay * (0.88 + 0.12 * settle),
    tie: tie * (0.85 + 0.15 * settle),
    kbrace: kbrace * (0.89 + 0.11 * settle),
  }
}

function foundationOpacity(completeness: number) {
  return smoothstep(0.02, 0.52, completeness * 2.35)
}

/** Podium + gentle waist — reads as base / shaft / crown. */
function planRadii(floor: number): { rx: number; rz: number } {
  const t = floor / Math.max(1, FLOORS - 1)
  const podium = floor <= 2 ? 1.08 - floor * 0.025 : 1
  const pinch = 1 - 0.055 * Math.sin(t * Math.PI)
  const crown = 1 + 0.035 * Math.sin(t * Math.PI * 0.65)
  return {
    rx: BASE_RX * podium * pinch * crown,
    rz: BASE_RZ * podium * pinch * (1 + 0.025 * t),
  }
}

/** Rounded “superellipse” plan — softer than a rectangle, more architectural than a circle. */
function housePlanXZ(theta: number, rx: number, rz: number, exp: number): THREE.Vector3 {
  const p = 2 / exp
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  const ax = rx * Math.sign(c) * Math.abs(c) ** p
  const az = rz * Math.sign(s) * Math.abs(s) ** p
  return new THREE.Vector3(ax, 0, az)
}

/** Closed horizontal plan loop for `lineLoop` — no repeated first vertex. */
function createPlanLoopGeometry(
  rx: number,
  rz: number,
  y: number,
  segments: number,
  exp: number,
) {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i < segments; i++) {
    const u = (i / segments) * Math.PI * 2
    const p = housePlanXZ(u, rx, rz, exp)
    pts.push(new THREE.Vector3(p.x, y, p.z))
  }
  return new THREE.BufferGeometry().setFromPoints(pts)
}

function houseLoop(rx: number, rz: number, y: number, segments: number) {
  return createPlanLoopGeometry(rx, rz, y, segments, HOUSE_EXP)
}

function boxLoop(rx: number, rz: number, y: number, segments: number) {
  return createPlanLoopGeometry(rx, rz, y, segments, BOX_EXP)
}

function mergeLineSegments(geometries: THREE.BufferGeometry[]) {
  const pts: THREE.Vector3[] = []
  for (const g of geometries) {
    const p = g.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < p.count; i++) {
      pts.push(new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)))
    }
  }
  return new THREE.BufferGeometry().setFromPoints(pts)
}

/** Polyline → segment pairs for `lineSegments` (avoids React SVG `line`). */
function polylineToSegments(points: THREE.Vector3[]) {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i < points.length - 1; i++) {
    pts.push(points[i], points[i + 1])
  }
  return new THREE.BufferGeometry().setFromPoints(pts)
}

function GroundGrid() {
  const lines = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const size = 18
    const div = 28
    for (let i = 0; i <= div; i++) {
      const p = (i / div - 0.5) * size
      pts.push(new THREE.Vector3(-size / 2, 0, p), new THREE.Vector3(size / 2, 0, p))
      pts.push(new THREE.Vector3(p, 0, -size / 2), new THREE.Vector3(p, 0, size / 2))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [])

  return (
    <lineSegments geometry={lines}>
      <lineBasicMaterial color={GRID} transparent opacity={0.34} />
    </lineSegments>
  )
}

function PodiumCurves() {
  const geos = useMemo(() => {
    const list: THREE.BufferGeometry[] = []
    const ptsR: THREE.Vector3[] = []
    for (let k = 0; k < 14; k++) {
      const th = (k / 14) * Math.PI * 2
      const p0 = housePlanXZ(th, BASE_RX * 0.32, BASE_RZ * 0.32, HOUSE_EXP)
      const p1 = housePlanXZ(th, BASE_RX * 1.28, BASE_RZ * 1.28, HOUSE_EXP)
      ptsR.push(new THREE.Vector3(p0.x, 0.002, p0.z), new THREE.Vector3(p1.x, 0.002, p1.z))
    }
    list.push(new THREE.BufferGeometry().setFromPoints(ptsR))
    for (const s of [0.5, 0.72, 0.92, 1.12]) {
      list.push(houseLoop(BASE_RX * s, BASE_RZ * s, 0.002, 52))
    }
    return list
  }, [])

  return (
    <group>
      {geos.map((g, i) => (
        <lineSegments key={i} geometry={g}>
          <lineBasicMaterial color={GRID_ACCENT} transparent opacity={0.38} />
        </lineSegments>
      ))}
    </group>
  )
}

function FoundationMat() {
  const ref = useRef<THREE.Group>(null)
  const outline = useMemo(
    () => houseLoop(BASE_RX * 1.14, BASE_RZ * 1.14, -0.025, 60),
    [],
  )
  const haunch = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const n = 10
    for (let i = 0; i < n; i++) {
      const th0 = (i / n) * Math.PI * 2
      const th1 = ((i + 1) / n) * Math.PI * 2
      const p0 = housePlanXZ(th0, BASE_RX * 1.1, BASE_RZ * 1.1, HOUSE_EXP)
      const p1 = housePlanXZ(th1, BASE_RX * 1.1, BASE_RZ * 1.1, HOUSE_EXP)
      const mid = housePlanXZ((th0 + th1) / 2, BASE_RX * 1.34, BASE_RZ * 1.34, HOUSE_EXP)
      const c = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(p0.x, -0.025, p0.z),
        new THREE.Vector3(mid.x * 1.04, -0.16, mid.z * 1.04),
        new THREE.Vector3(p1.x, -0.025, p1.z),
      )
      const arcPts = c.getPoints(12)
      for (let j = 0; j < arcPts.length - 1; j++) {
        pts.push(arcPts[j], arcPts[j + 1])
      }
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [])

  useFrame((state) => {
    const cs = getCycleState(state.clock.elapsedTime)
    setLineOpacity(ref.current, foundationOpacity(cs.completeness), 0.75)
  })

  return (
    <group ref={ref}>
      <lineLoop geometry={outline}>
        <lineBasicMaterial color={ACCENT_SOFT} transparent opacity={0} />
      </lineLoop>
      <lineSegments geometry={haunch}>
        <lineBasicMaterial color={ACCENT_DIM} transparent opacity={0} />
      </lineSegments>
    </group>
  )
}

/** Pilotis + entry curve — only under first slab. */
function PodiumPilotis() {
  const ref = useRef<THREE.Group>(null)
  const { rx, rz } = planRadii(0)
  const wideRx = rx * 1.06
  const wideRz = rz * 1.06

  const columns = useMemo(() => {
    const geos: THREE.BufferGeometry[] = []
    const n = 10
    const y0 = -0.18
    const y1 = 0.04
    for (let i = 0; i < n; i++) {
      const th = (i / n) * Math.PI * 2
      const p = housePlanXZ(th, wideRx, wideRz, HOUSE_EXP)
      geos.push(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(p.x, y0, p.z),
          new THREE.Vector3(p.x * 0.98, y1, p.z * 0.98),
        ]),
      )
    }
    return mergeLineSegments(geos)
  }, [wideRx, wideRz])

  const canopyGeo = useMemo(() => {
    const th0 = Math.PI * 0.15
    const th1 = Math.PI * 0.85
    const a = housePlanXZ(th0, wideRx * 0.92, wideRz * 0.92, HOUSE_EXP)
    const b = housePlanXZ(th1, wideRx * 0.92, wideRz * 0.92, HOUSE_EXP)
    const c = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(a.x, 0.06, a.z),
      new THREE.Vector3(0, 0.22, wideRz * 1.05),
      new THREE.Vector3(b.x, 0.06, b.z),
    )
    return polylineToSegments(c.getPoints(24))
  }, [wideRx, wideRz])

  useFrame((state) => {
    const cs = getCycleState(state.clock.elapsedTime)
    const wave = cs.completeness * 2.2
    const v = smoothstep(0.05, 0.45, wave)
    setLineOpacity(ref.current, v, 0.55)
  })

  return (
    <group ref={ref}>
      <lineSegments geometry={columns}>
        <lineBasicMaterial color={STEEL_BRIGHT} transparent opacity={0} />
      </lineSegments>
      <lineSegments geometry={canopyGeo}>
        <lineBasicMaterial color={ACCENT} transparent opacity={0} />
      </lineSegments>
    </group>
  )
}

/** Low side wing — squarer superellipse so it reads as a garage / annex beside the tower. */
function PodiumGarageWing() {
  const ref = useRef<THREE.Group>(null)
  const geos = useMemo(() => {
    const gx = BASE_RX * 0.44
    const gz = BASE_RZ * 0.52
    return [
      boxLoop(gx, gz, 0.035, 42),
      boxLoop(gx * 0.86, gz * 0.9, 0.19, 38),
      boxLoop(gx * 0.78, gz * 0.84, 0.34, 34),
    ]
  }, [])

  useFrame((state) => {
    const cs = getCycleState(state.clock.elapsedTime)
    setLineOpacity(ref.current, smoothstep(0.08, 0.42, cs.completeness * 2.05), 0.44)
  })

  return (
    <group ref={ref} position={[BASE_RX * 0.78, 0, -BASE_RZ * 0.62]} rotation={[0, 0.11, 0]}>
      {geos.map((g, i) => (
        <lineLoop key={i} geometry={g}>
          <lineBasicMaterial color={STEEL} transparent opacity={0} />
        </lineLoop>
      ))}
    </group>
  )
}

function GhostShell({ height }: { height: number }) {
  const meridianGeos = useMemo(() => {
    const list: THREE.BufferGeometry[] = []
    const steps = FLOORS
    for (let m = 0; m < 14; m++) {
      const th = (m / 14) * Math.PI * 2
      const pts: THREE.Vector3[] = []
      for (let f = 0; f <= steps; f++) {
        const { rx, rz } = planRadii(Math.min(f, FLOORS - 1))
        const p = housePlanXZ(th, rx * 1.015, rz * 1.015, HOUSE_EXP)
        pts.push(new THREE.Vector3(p.x, (f / steps) * height, p.z))
      }
      list.push(polylineToSegments(pts))
    }
    return list
  }, [height])

  const roofGhost = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const rx = BASE_RX
    const rz = BASE_RZ
    for (let i = 0; i <= 48; i++) {
      const u = (i / 48) * Math.PI * 2
      const hp = housePlanXZ(u, rx * 0.92, rz * 0.92, HOUSE_EXP)
      const lift = Math.sin(u * 2) * 0.08 + 0.38
      pts.push(new THREE.Vector3(hp.x * 0.35, height + lift, hp.z))
    }
    const seg = polylineToSegments(pts)
    const p = seg.getAttribute('position') as THREE.BufferAttribute
    const a = new THREE.Vector3(p.getX(p.count - 1), p.getY(p.count - 1), p.getZ(p.count - 1))
    const b = new THREE.Vector3(p.getX(0), p.getY(0), p.getZ(0))
    return mergeLineSegments([seg, new THREE.BufferGeometry().setFromPoints([a, b])])
  }, [height])

  return (
    <group>
      {meridianGeos.map((g, i) => (
        <lineSegments key={i} geometry={g}>
          <lineBasicMaterial color={GHOST} transparent opacity={0.038} depthWrite={false} />
        </lineSegments>
      ))}
      <lineSegments geometry={roofGhost}>
        <lineBasicMaterial color={GHOST} transparent opacity={0.032} depthWrite={false} />
      </lineSegments>
    </group>
  )
}

function CurvedFloorLayer({ floor }: { floor: number }) {
  const y = floor * FLOOR_H
  const { rx, rz } = planRadii(floor)
  const innerRx = rx * INNER_SCALE
  const innerRz = rz * INNER_SCALE
  const { rx: rxT, rz: rzT } = planRadii(Math.min(floor + 1, FLOORS - 1))

  const slabRef = useRef<THREE.LineLoop>(null)
  const corniceRef = useRef<THREE.LineLoop>(null)
  const coreRef = useRef<THREE.LineLoop>(null)
  const meridianGroup = useRef<THREE.Group>(null)
  const facadeRef = useRef<THREE.LineSegments>(null)
  const braceGroup = useRef<THREE.Group>(null)
  const bandRef = useRef<THREE.LineLoop>(null)
  const joistRef = useRef<THREE.LineSegments>(null)
  const bayRef = useRef<THREE.LineSegments>(null)
  const tieRef = useRef<THREE.LineLoop>(null)
  const kbraceRef = useRef<THREE.LineSegments>(null)
  const beltGroup = useRef<THREE.Group>(null)

  const slabGeo = useMemo(() => houseLoop(rx, rz, 0.018, SLAB_SEGMENTS), [rx, rz])
  const corniceGeo = useMemo(
    () => houseLoop(rx * 1.028, rz * 1.028, -0.012, SLAB_SEGMENTS),
    [rx, rz],
  )
  const coreGeo = useMemo(
    () => houseLoop(innerRx, innerRz, 0.018 + FLOOR_H * 0.46, 44),
    [innerRx, innerRz],
  )
  const bandGeo = useMemo(() => houseLoop(rx * 0.9, rz * 0.9, FLOOR_H * 0.64, 52), [rx, rz])
  const tieGeo = useMemo(() => houseLoop(rx * 0.78, rz * 0.78, FLOOR_H * 0.48, 44), [rx, rz])
  const beltOuterGeo = useMemo(() => houseLoop(rx * 0.925, rz * 0.925, FLOOR_H * 0.24, 56), [rx, rz])
  const beltInnerGeo = useMemo(() => houseLoop(rx * 0.875, rz * 0.875, FLOOR_H * 0.46, 52), [rx, rz])

  const meridianGeos = useMemo(() => {
    const list: THREE.BufferGeometry[] = []
    for (let m = 0; m < MERIDIANS; m++) {
      const th = (m / MERIDIANS) * Math.PI * 2
      const b = housePlanXZ(th, rx, rz, HOUSE_EXP)
      const t = housePlanXZ(th, rxT, rzT, HOUSE_EXP)
      list.push(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(b.x, 0.035, b.z),
          new THREE.Vector3(t.x, FLOOR_H - 0.035, t.z),
        ]),
      )
    }
    return list
  }, [rx, rz, rxT, rzT])

  const braceGeos = useMemo(() => {
    const list: THREE.BufferGeometry[] = []
    const n = 7
    for (let i = 0; i < n; i++) {
      const th0 = (i / n) * Math.PI * 2
      const th1 = ((i + 1) / n) * Math.PI * 2
      const a = housePlanXZ(th0, rx, rz, HOUSE_EXP)
      const b = housePlanXZ(th1, rxT, rzT, HOUSE_EXP)
      list.push(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(a.x, 0.055, a.z),
          new THREE.Vector3(b.x, FLOOR_H - 0.055, b.z),
        ]),
      )
      const c = housePlanXZ(th1, rx, rz, HOUSE_EXP)
      const d = housePlanXZ(th0, rxT, rzT, HOUSE_EXP)
      list.push(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(c.x, 0.055, c.z),
          new THREE.Vector3(d.x, FLOOR_H - 0.055, d.z),
        ]),
      )
    }
    return list
  }, [rx, rz, rxT, rzT])

  const facadeGeo = useMemo(() => {
    const segs: THREE.BufferGeometry[] = []
    const inset = 0.965
    for (let m = 0; m < MULLIONS; m++) {
      const th = (m / MULLIONS) * Math.PI * 2
      const b = housePlanXZ(th, rx * inset, rz * inset, HOUSE_EXP)
      const yb = FLOOR_H * 0.12
      const yt = FLOOR_H * 0.88
      const wb = housePlanXZ(th, rx * inset * 0.998, rz * inset * 0.998, HOUSE_EXP)
      const wt = housePlanXZ(th, rxT * inset * 0.998, rzT * inset * 0.998, HOUSE_EXP)
      segs.push(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(wb.x, yb, wb.z),
          new THREE.Vector3(b.x, FLOOR_H * 0.38, b.z),
        ]),
      )
      segs.push(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(b.x, FLOOR_H * 0.42, b.z),
          new THREE.Vector3(wt.x, yt, wt.z),
        ]),
      )
    }
    const sp: THREE.Vector3[] = []
    for (const h of [0.32, 0.58]) {
      const ring = houseLoop(rx * inset * 0.99, rz * inset * 0.99, FLOOR_H * h, 48)
      const pos = ring.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) {
        const j = (i + 1) % pos.count
        sp.push(
          new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)),
          new THREE.Vector3(pos.getX(j), pos.getY(j), pos.getZ(j)),
        )
      }
    }
    segs.push(new THREE.BufferGeometry().setFromPoints(sp))
    return mergeLineSegments(segs)
  }, [rx, rz, rxT, rzT])

  const joistGeo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const yj = 0.014
    const strips = 13
    for (let s = 0; s < strips; s++) {
      const v = -1 + (s / (strips - 1)) * 2
      const z0 = v * rz * 0.91
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-rx * 0.96, yj, z0),
        new THREE.Vector3(0, yj + 0.01, z0 * 0.96),
        new THREE.Vector3(rx * 0.96, yj, z0),
      )
      const arc = curve.getPoints(16)
      for (let j = 0; j < arc.length - 1; j++) {
        pts.push(arc[j], arc[j + 1])
      }
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [rx, rz])

  const bayGeo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const baseX = rx * 0.7
    const baseZ = rz * 0.12
    const bump = 0.2
    const curve = new THREE.EllipseCurve(baseX, baseZ, bump, bump * 0.52, -0.35, Math.PI * 0.95, false, 0)
    const flat = curve.getPoints(22)
    const y0 = FLOOR_H * 0.2
    const y1 = FLOOR_H * 0.8
    for (const yy of [y0, y1]) {
      for (let i = 0; i < flat.length - 1; i++) {
        const a = flat[i]
        const b = flat[i + 1]
        pts.push(new THREE.Vector3(a.x, yy, a.y), new THREE.Vector3(b.x, yy, b.y))
      }
    }
    const mid = curve.getPoint(0.5)
    pts.push(new THREE.Vector3(mid.x, y0, mid.y), new THREE.Vector3(mid.x, y1, mid.y))
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [rx, rz])

  const kbraceGeo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (const sign of [-1, 1] as const) {
      const thA = sign * (Math.PI * 0.32)
      const a = housePlanXZ(thA, rx * 0.94, rz * 0.38, HOUSE_EXP)
      const b = housePlanXZ(0, rxT * 0.22, rzT * 0.94, HOUSE_EXP)
      pts.push(new THREE.Vector3(a.x, 0.05, a.z), new THREE.Vector3(b.x, FLOOR_H * 0.56, b.z))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [rx, rz, rxT, rzT])

  useFrame((state) => {
    const cs = getCycleState(state.clock.elapsedTime)
    const o = floorPartOpacity(floor, cs.completeness)
    setLineOpacity(slabRef.current, o.slab, 0.88)
    setLineOpacity(corniceRef.current, o.cornice, 0.62)
    setLineOpacity(coreRef.current, o.core, 0.54)
    setLineOpacity(meridianGroup.current, o.meridian, 0.44)
    setLineOpacity(facadeRef.current, o.facade, 0.36)
    setLineOpacity(braceGroup.current, o.brace, 0.5)
    setLineOpacity(bandRef.current, o.band, 0.34)
    setLineOpacity(joistRef.current, o.joist, 0.36)
    setLineOpacity(bayRef.current, o.bay, 0.48)
    setLineOpacity(tieRef.current, o.tie, 0.4)
    setLineOpacity(kbraceRef.current, o.kbrace, 0.44)
    setLineOpacity(beltGroup.current, o.belt, 0.36)
  })

  return (
    <group position={[0, y, 0]}>
      <lineLoop ref={corniceRef} geometry={corniceGeo}>
        <lineBasicMaterial color={ACCENT} transparent opacity={0} />
      </lineLoop>
      <lineLoop ref={slabRef} geometry={slabGeo}>
        <lineBasicMaterial color={ACCENT_SOFT} transparent opacity={0} />
      </lineLoop>
      <lineLoop ref={coreRef} geometry={coreGeo}>
        <lineBasicMaterial color={STEEL_BRIGHT} transparent opacity={0} />
      </lineLoop>
      <group ref={meridianGroup}>
        {meridianGeos.map((g, i) => (
          <lineSegments key={i} geometry={g}>
            <lineBasicMaterial color={ACCENT_DIM} transparent opacity={0} />
          </lineSegments>
        ))}
      </group>
      <lineSegments ref={facadeRef} geometry={facadeGeo}>
        <lineBasicMaterial color={STEEL} transparent opacity={0} />
      </lineSegments>
      <group ref={braceGroup}>
        {braceGeos.map((g, i) => (
          <lineSegments key={i} geometry={g}>
            <lineBasicMaterial color={STEEL} transparent opacity={0} />
          </lineSegments>
        ))}
      </group>
      <lineLoop ref={bandRef} geometry={bandGeo}>
        <lineBasicMaterial color={ACCENT_DIM} transparent opacity={0} />
      </lineLoop>
      <group ref={beltGroup}>
        <lineLoop geometry={beltOuterGeo}>
          <lineBasicMaterial color={GRID_ACCENT} transparent opacity={0} />
        </lineLoop>
        <lineLoop geometry={beltInnerGeo}>
          <lineBasicMaterial color={STEEL} transparent opacity={0} />
        </lineLoop>
      </group>
      <lineSegments ref={joistRef} geometry={joistGeo}>
        <lineBasicMaterial color={ACCENT_DIM} transparent opacity={0} />
      </lineSegments>
      <lineSegments ref={bayRef} geometry={bayGeo}>
        <lineBasicMaterial color={ACCENT_SOFT} transparent opacity={0} />
      </lineSegments>
      <lineLoop ref={tieRef} geometry={tieGeo}>
        <lineBasicMaterial color={ACCENT_SOFT} transparent opacity={0} />
      </lineLoop>
      <lineSegments ref={kbraceRef} geometry={kbraceGeo}>
        <lineBasicMaterial color={STEEL} transparent opacity={0} />
      </lineSegments>
    </group>
  )
}

function CurvedRoofAssembly({ y, baseRx, baseRz }: { y: number; baseRx: number; baseRz: number }) {
  const rafterGroup = useRef<THREE.Group>(null)
  const ridgeRef = useRef<THREE.LineSegments>(null)
  const eaveRef = useRef<THREE.LineLoop>(null)
  const parapetRef = useRef<THREE.LineLoop>(null)
  const crownRef = useRef<THREE.LineLoop>(null)
  const louverRef = useRef<THREE.LineSegments>(null)

  const ridgeGeo = useMemo(() => {
    const z0 = -baseRz * 0.9
    const z1 = baseRz * 0.9
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, y + 0.48, z0),
      new THREE.Vector3(0, y + 0.48, z1),
    ])
  }, [y, baseRz])

  const eaveGeo = useMemo(
    () => houseLoop(baseRx * 1.01, baseRz * 1.01, y + 0.055, 64),
    [y, baseRx, baseRz],
  )
  const parapetGeo = useMemo(
    () => houseLoop(baseRx * 1.04, baseRz * 1.04, y + 0.12, 64),
    [y, baseRx, baseRz],
  )
  const crownGeo = useMemo(
    () => houseLoop(baseRx * 1.07, baseRz * 1.07, y + 0.2, 56),
    [y, baseRx, baseRz],
  )

  const rafterGeos = useMemo(() => {
    const list: THREE.BufferGeometry[] = []
    const ridgeY = y + 0.48
    const eaveY = y + 0.055
    const n = 18
    for (let i = 0; i < n; i++) {
      const u = i / Math.max(1, n - 1)
      const z = -baseRz * 0.9 + u * baseRz * 1.8
      const denom = (baseRz * 1.01) ** 2
      const inner = Math.max(0, 1 - (z * z) / denom)
      const xe = baseRx * 1.01 * Math.sqrt(inner)
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(xe, eaveY, z),
        new THREE.Vector3(0, ridgeY - 0.015, z * 0.12),
        new THREE.Vector3(-xe * 0.96, eaveY, z),
      )
      list.push(polylineToSegments(curve.getPoints(20)))
    }
    return list
  }, [y, baseRx, baseRz])

  const louverGeo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const y0 = y + 0.14
    const spread = 0.34
    for (let k = -6; k <= 6; k++) {
      const x = (k / 6) * baseRx * 0.55
      pts.push(new THREE.Vector3(x, y0, -spread), new THREE.Vector3(x, y0 + 0.08, spread))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [y, baseRx])

  useFrame((state) => {
    const cs = getCycleState(state.clock.elapsedTime)
    const wave = cs.completeness * (FLOORS + 0.64) + 0.06
    const f0 = FLOORS * 0.9
    const roof = smoothstep(f0 + 0.06, f0 + 0.58, wave)
    const ridge = smoothstep(f0 + 0.18, f0 + 0.68, wave)
    const crown = smoothstep(f0 + 0.28, f0 + 0.82, wave)
    setLineOpacity(rafterGroup.current, roof, 0.58)
    setLineOpacity(ridgeRef.current, ridge, 0.56)
    setLineOpacity(eaveRef.current, roof * 0.94, 0.46)
    setLineOpacity(parapetRef.current, roof * 0.88, 0.42)
    setLineOpacity(crownRef.current, crown, 0.38)
    setLineOpacity(louverRef.current, crown * 0.85, 0.32)
  })

  return (
    <group>
      <lineLoop ref={eaveRef} geometry={eaveGeo}>
        <lineBasicMaterial color={ACCENT_DIM} transparent opacity={0} />
      </lineLoop>
      <lineSegments ref={ridgeRef} geometry={ridgeGeo}>
        <lineBasicMaterial color={ACCENT} transparent opacity={0} />
      </lineSegments>
      <group ref={rafterGroup}>
        {rafterGeos.map((g, i) => (
          <lineSegments key={i} geometry={g}>
            <lineBasicMaterial color={STEEL_BRIGHT} transparent opacity={0} />
          </lineSegments>
        ))}
      </group>
      <lineLoop ref={parapetRef} geometry={parapetGeo}>
        <lineBasicMaterial color={ACCENT_SOFT} transparent opacity={0} />
      </lineLoop>
      <lineLoop ref={crownRef} geometry={crownGeo}>
        <lineBasicMaterial color={ACCENT} transparent opacity={0} />
      </lineLoop>
      <lineSegments ref={louverRef} geometry={louverGeo}>
        <lineBasicMaterial color={STEEL} transparent opacity={0} />
      </lineSegments>
    </group>
  )
}

export function HeroBuildAssembly() {
  const root = useRef<THREE.Group>(null)

  useFrame((state) => {
    const g = root.current
    if (!g) return
    const t = state.clock.elapsedTime
    g.rotation.y = t * 0.065 + Math.sin(t * 0.1) * 0.024
    g.position.y = Math.sin(t * 0.15) * 0.038
    const cam = state.camera
    cam.position.x = Math.sin(t * 0.068) * 0.26
    cam.position.y = 3.4 + Math.sin(t * 0.12) * 0.07
    cam.position.z = 11.05 + Math.cos(t * 0.085) * 0.18
    cam.lookAt(0, 2.58, 0)
  })

  const totalH = FLOORS * FLOOR_H
  const topRx = planRadii(FLOORS - 1).rx
  const topRz = planRadii(FLOORS - 1).rz

  return (
    <group ref={root}>
      <FoundationMat />
      <PodiumPilotis />
      <PodiumGarageWing />
      <PodiumCurves />
      <GroundGrid />
      <GhostShell height={totalH} />
      {Array.from({ length: FLOORS }, (_, f) => (
        <CurvedFloorLayer key={f} floor={f} />
      ))}
      <CurvedRoofAssembly y={totalH} baseRx={topRx} baseRz={topRz} />
    </group>
  )
}
