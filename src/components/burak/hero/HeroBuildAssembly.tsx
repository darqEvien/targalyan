import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getCycleState, smoothstep } from '../buildCycle'

const ACCENT = '#c8a96e'
const STEEL = '#6b6354'
const GRID = '#2a2822'
const GHOST = '#3d3528'

const FLOORS = 11
const FLOOR_H = 0.58
const BW = 1.05
const BD = 0.72

const COLS: [number, number][] = [
  [-BW, -BD],
  [-BW, 0],
  [-BW, BD],
  [BW, -BD],
  [BW, 0],
  [BW, BD],
  [0, -BD],
  [0, BD],
]

function setLineOpacity(obj: THREE.Object3D | null, opacity: number, mul = 1) {
  if (!obj) return
  const o = Math.min(1, Math.max(0, opacity)) * mul
  obj.traverse((ch) => {
    const m = (ch as THREE.LineSegments).material as THREE.LineBasicMaterial | undefined
    if (m && 'opacity' in m) {
      m.opacity = o
      m.transparent = true
    }
  })
}

/** Single rising/falling wave — build and demolish are symmetric in `completeness`. */
function floorPartOpacity(
  floor: number,
  completeness: number,
): { slab: number; col: number; brace: number; band: number } {
  const n = FLOORS
  const wave = completeness * (n + 0.58) + 0.1
  const f0 = floor * 0.94
  const slab = smoothstep(f0 + 0.02, f0 + 0.36, wave)
  const col = smoothstep(f0 + 0.2, f0 + 0.6, wave)
  const brace = smoothstep(f0 + 0.44, f0 + 0.9, wave)
  const band = smoothstep(f0 + 0.56, f0 + 0.99, wave)
  const settle = smoothstep(0.88, 1, completeness)
  const breathe = 0.035 * Math.sin(settle * Math.PI * 2.1)
  return {
    slab: Math.min(1, slab * (1 + breathe)),
    col: col * (0.93 + 0.07 * settle),
    brace: brace * (0.9 + 0.1 * settle),
    band: band * (0.88 + 0.12 * settle),
  }
}

function GroundGrid() {
  const lines = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pts: THREE.Vector3[] = []
    const size = 16
    const div = 20
    for (let i = 0; i <= div; i++) {
      const p = (i / div - 0.5) * size
      pts.push(new THREE.Vector3(-size / 2, 0, p), new THREE.Vector3(size / 2, 0, p))
      pts.push(new THREE.Vector3(p, 0, -size / 2), new THREE.Vector3(p, 0, size / 2))
    }
    g.setFromPoints(pts)
    return g
  }, [])

  return (
    <lineSegments geometry={lines}>
      <lineBasicMaterial color={GRID} transparent opacity={0.55} />
    </lineSegments>
  )
}

function GhostShell({ height }: { height: number }) {
  const colGeos = useMemo(
    () => COLS.map(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(0.07, height, 0.07))),
    [height],
  )
  const topGeo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(BW * 2, 0.035, BD * 2)),
    [],
  )

  return (
    <group position={[0, height / 2, 0]}>
      {COLS.map(([x, z], i) => (
        <lineSegments key={i} geometry={colGeos[i]} position={[x, 0, z]}>
          <lineBasicMaterial color={GHOST} transparent opacity={0.055} depthWrite={false} />
        </lineSegments>
      ))}
      <lineSegments geometry={topGeo} position={[0, height / 2, 0]}>
        <lineBasicMaterial color={GHOST} transparent opacity={0.048} depthWrite={false} />
      </lineSegments>
    </group>
  )
}

function FloorBuildLayer({ floor }: { floor: number }) {
  const y = floor * FLOOR_H
  const slabRef = useRef<THREE.LineSegments>(null)
  const colGroup = useRef<THREE.Group>(null)
  const braceGroup = useRef<THREE.Group>(null)
  const bandGroup = useRef<THREE.Group>(null)

  const { slabGeo, colGeo, bandGeo } = useMemo(() => {
    const slabGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(BW * 2, 0.04, BD * 2))
    const colGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.08, FLOOR_H, 0.08))
    const bandGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(BW * 2 - 0.12, 0.025, BD * 2 - 0.12))
    return { slabGeo, colGeo, bandGeo }
  }, [])

  const braceGeos = useMemo(() => {
    const geos: THREE.BufferGeometry[] = []
    const bz = [-BD, BD] as const
    for (const z of bz) {
      const p0 = new THREE.Vector3(-BW, 0, z)
      const p1 = new THREE.Vector3(BW, FLOOR_H, z)
      geos.push(new THREE.BufferGeometry().setFromPoints([p0, p1]))
      const q0 = new THREE.Vector3(-BW, FLOOR_H, z)
      const q1 = new THREE.Vector3(BW, 0, z)
      geos.push(new THREE.BufferGeometry().setFromPoints([q0, q1]))
    }
    geos.push(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, -BD),
        new THREE.Vector3(0, FLOOR_H, BD),
      ]),
    )
    return geos
  }, [])

  useFrame((state) => {
    const cs = getCycleState(state.clock.elapsedTime)
    const { slab, col, brace, band } = floorPartOpacity(floor, cs.completeness)
    setLineOpacity(slabRef.current, slab, 0.78)
    setLineOpacity(colGroup.current, col, 0.5)
    setLineOpacity(braceGroup.current, brace, 0.58)
    setLineOpacity(bandGroup.current, band, 0.34)
  })

  return (
    <group position={[0, y, 0]}>
      <lineSegments ref={slabRef} geometry={slabGeo}>
        <lineBasicMaterial color={ACCENT} transparent opacity={0} />
      </lineSegments>
      <group ref={colGroup}>
        {COLS.map(([x, z], i) => (
          <lineSegments key={i} geometry={colGeo} position={[x, FLOOR_H / 2, z]}>
            <lineBasicMaterial color={ACCENT} transparent opacity={0} />
          </lineSegments>
        ))}
      </group>
      <group ref={braceGroup}>
        {braceGeos.map((g, i) => (
          <lineSegments key={i} geometry={g}>
            <lineBasicMaterial color={STEEL} transparent opacity={0} />
          </lineSegments>
        ))}
      </group>
      <group ref={bandGroup}>
        <lineSegments geometry={bandGeo} position={[0, FLOOR_H * 0.62, 0]}>
          <lineBasicMaterial color={ACCENT} transparent opacity={0} />
        </lineSegments>
      </group>
    </group>
  )
}

function RoofCrown({ y }: { y: number }) {
  const ref = useRef<THREE.LineSegments>(null)
  const geo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(BW * 2 + 0.12, 0.12, BD * 2 + 0.12)),
    [],
  )

  useFrame((state) => {
    const cs = getCycleState(state.clock.elapsedTime)
    const wave = cs.completeness * (FLOORS + 0.58) + 0.1
    const f0 = FLOORS * 0.94
    const v = smoothstep(f0 + 0.15, f0 + 0.62, wave)
    setLineOpacity(ref.current, v, 0.52)
  })

  return (
    <lineSegments ref={ref} geometry={geo} position={[0, y, 0]}>
      <lineBasicMaterial color={ACCENT} transparent opacity={0} />
    </lineSegments>
  )
}

export function HeroBuildAssembly() {
  const root = useRef<THREE.Group>(null)

  useFrame((state) => {
    const g = root.current
    if (!g) return
    const t = state.clock.elapsedTime
    g.rotation.y = t * 0.11 + Math.sin(t * 0.17) * 0.04
    g.position.y = Math.sin(t * 0.22) * 0.06
    const cam = state.camera
    cam.position.x = Math.sin(t * 0.09) * 0.25
    cam.position.y = 3.35 + Math.sin(t * 0.18) * 0.1
    cam.position.z = 10.85 + Math.cos(t * 0.11) * 0.15
    cam.lookAt(0, 2.65, 0)
  })

  const totalH = FLOORS * FLOOR_H

  return (
    <group ref={root}>
      <GroundGrid />
      <GhostShell height={totalH} />
      {Array.from({ length: FLOORS }, (_, f) => (
        <FloorBuildLayer key={f} floor={f} />
      ))}
      <RoofCrown y={totalH + 0.06} />
    </group>
  )
}
