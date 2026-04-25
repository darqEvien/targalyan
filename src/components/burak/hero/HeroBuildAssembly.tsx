import { useMemo, useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getCycleState, smoothstep } from '../buildCycle'

// ─── Palette ──────────────────────────────────────────────────────────────────
const ACCENT       = '#e4cf98'
const ACCENT_SOFT  = '#c4a86a'
const ACCENT_DIM   = '#8f784d'
const ACCENT_COOL  = '#9fb8c8'
const STEEL        = '#5a554c'
const STEEL_BRIGHT = '#8a8274'
const GLASS        = '#6a8090'
const GLASS_LIGHT  = '#9ab8c8'
const GRID         = '#1a1814'
const GRID_ACCENT  = '#252320'
const GHOST        = '#2e2c28'
const CONCRETE     = '#4a4840'
const COPPER       = '#7a5a38'

// ─── Geometry Helpers ─────────────────────────────────────────────────────────
function setLineOpacity(obj: THREE.Object3D | null, opacity: number, mul = 1) {
  if (!obj) return
  const o = Math.min(1, Math.max(0, opacity)) * mul
  obj.traverse((ch) => {
    const m = (ch as THREE.Line).material as THREE.LineBasicMaterial | undefined
    if (m && 'opacity' in m) { m.opacity = o; m.transparent = true }
  })
}

function superellipse(theta: number, rx: number, rz: number, exp: number): THREE.Vector3 {
  const p = 2 / exp
  const c = Math.cos(theta), s = Math.sin(theta)
  return new THREE.Vector3(
    rx * Math.sign(c) * Math.abs(c) ** p,
    0,
    rz * Math.sign(s) * Math.abs(s) ** p,
  )
}

function createLoop(rx: number, rz: number, y: number, segs: number, exp = 4.0): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i < segs; i++) {
    const u = (i / segs) * Math.PI * 2
    const p = superellipse(u, rx, rz, exp)
    pts.push(new THREE.Vector3(p.x, y, p.z))
  }
  return new THREE.BufferGeometry().setFromPoints(pts)
}

function segsFromPoints(pts: THREE.Vector3[]): THREE.BufferGeometry {
  const arr: THREE.Vector3[] = []
  for (let i = 0; i < pts.length - 1; i++) arr.push(pts[i], pts[i + 1])
  return new THREE.BufferGeometry().setFromPoints(arr)
}

function merge(...geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = []
  for (const g of geos) {
    const pos = g.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++)
      pts.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)))
  }
  return new THREE.BufferGeometry().setFromPoints(pts)
}

function smoothstepV(completeness: number, start: number, end: number): number {
  return smoothstep(start, end, completeness)
}

// ─── Ground ───────────────────────────────────────────────────────────────────
function GroundGrid() {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const size = 22, div = 32
    for (let i = 0; i <= div; i++) {
      const p = (i / div - 0.5) * size
      pts.push(new THREE.Vector3(-size / 2, 0, p), new THREE.Vector3(size / 2, 0, p))
      pts.push(new THREE.Vector3(p, 0, -size / 2), new THREE.Vector3(p, 0, size / 2))
    }
    // Accent rings
    for (const r of [1.4, 2.8, 4.5, 6.5]) {
      const n = 64
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2
        pts.push(new THREE.Vector3(Math.cos(a0) * r, 0, Math.sin(a0) * r))
        pts.push(new THREE.Vector3(Math.cos(a1) * r, 0, Math.sin(a1) * r))
      }
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [])
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color={GRID} transparent opacity={0.42} />
    </lineSegments>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILDING A — Curved Modernist Tower (center, tallest)
// Inspired by: Aqua Tower, Zaha Hadid style organic
// ═══════════════════════════════════════════════════════════════════════════════
const TOWER_FLOORS = 14
const TOWER_FH = 0.52
const TOWER_RX = 0.88
const TOWER_RZ = 0.68

function towerPlan(floor: number) {
  const t = floor / (TOWER_FLOORS - 1)
  const twist = Math.sin(t * Math.PI * 1.8) * 0.06
  const taper = 1 - t * 0.22 + Math.sin(t * Math.PI) * 0.08
  return {
    rx: TOWER_RX * taper,
    rz: TOWER_RZ * taper,
    twist,
    exp: 3.2 + t * 0.8,
  }
}

function TowerFloor({ floor }: { floor: number }) {
  const y = floor * TOWER_FH
  const { rx, rz, twist, exp } = towerPlan(floor)
  const { rx: rxT, rz: rzT, exp: expT } = towerPlan(Math.min(floor + 1, TOWER_FLOORS - 1))

  const refs = {
    slab: useRef<THREE.LineLoop>(null),
    cornice: useRef<THREE.LineLoop>(null),
    balcony: useRef<THREE.LineLoop>(null),
    inner: useRef<THREE.LineLoop>(null),
    meridians: useRef<THREE.Group>(null),
    facade: useRef<THREE.LineSegments>(null),
    brace: useRef<THREE.LineSegments>(null),
    band: useRef<THREE.LineLoop>(null),
    spandrel: useRef<THREE.LineLoop>(null),
  }

  // Unique balcony slab — undulating offset that varies per floor
  const balconyOffset = 0.04 + 0.05 * Math.sin(floor * 0.88)

  const slabGeo    = useMemo(() => createLoop(rx, rz, 0.014, 72, exp), [rx, rz, exp])
  const corniceGeo = useMemo(() => createLoop(rx + 0.024, rz + 0.024, -0.01, 72, exp), [rx, rz, exp])
  const balconyGeo = useMemo(() => createLoop(rx + balconyOffset, rz + balconyOffset * 0.7, 0.02, 80, exp + 0.3), [rx, rz, exp, balconyOffset])
  const innerGeo   = useMemo(() => createLoop(rx * 0.28, rz * 0.28, TOWER_FH * 0.5, 36, 3.5), [rx, rz])
  const bandGeo    = useMemo(() => createLoop(rx * 0.92, rz * 0.92, TOWER_FH * 0.66, 56, exp), [rx, rz, exp])
  const spandrelGeo= useMemo(() => createLoop(rx * 0.96, rz * 0.96, TOWER_FH * 0.88, 60, exp), [rx, rz, exp])

  const meridianGeos = useMemo(() => {
    const list: THREE.BufferGeometry[] = []
    const n = 26
    for (let m = 0; m < n; m++) {
      const th = (m / n) * Math.PI * 2 + twist
      const b = superellipse(th, rx, rz, exp)
      const t2 = superellipse(th + twist * 0.3, rxT, rzT, expT)
      list.push(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(b.x, 0.04, b.z),
        new THREE.Vector3(t2.x, TOWER_FH - 0.04, t2.z),
      ]))
    }
    return list
  }, [rx, rz, rxT, rzT, exp, expT, twist])

  const facadeGeo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const n = 42
    for (let i = 0; i < n; i++) {
      const th = (i / n) * Math.PI * 2 + twist
      const b = superellipse(th, rx * 0.975, rz * 0.975, exp)
      // Spandrel horizontal at 3 heights
      for (const frac of [0.18, 0.52, 0.82]) {
        const th2 = (i + 1) / n * Math.PI * 2 + twist
        const b2 = superellipse(th2, rx * 0.975, rz * 0.975, exp)
        pts.push(
          new THREE.Vector3(b.x, TOWER_FH * frac, b.z),
          new THREE.Vector3(b2.x, TOWER_FH * frac, b2.z),
        )
      }
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [rx, rz, exp, twist])

  const braceGeo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const n = 6
    for (let i = 0; i < n; i++) {
      const th0 = (i / n) * Math.PI * 2 + twist
      const th1 = ((i + 0.5) / n) * Math.PI * 2 + twist
      const a = superellipse(th0, rx, rz, exp)
      const b = superellipse(th1, rxT, rzT, expT)
      pts.push(new THREE.Vector3(a.x, 0.06, a.z), new THREE.Vector3(b.x, TOWER_FH - 0.06, b.z))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [rx, rz, rxT, rzT, exp, expT, twist])

  useFrame((state) => {
    const cs = getCycleState(state.clock.elapsedTime)
    const wave = cs.completeness * (TOWER_FLOORS + 0.7) + 0.05
    const f0 = floor * 0.88
    const slab     = smoothstep(f0 + 0.02, f0 + 0.28, wave)
    const cornice  = smoothstep(f0 + 0.04, f0 + 0.32, wave)
    const balcony  = smoothstep(f0 + 0.06, f0 + 0.36, wave)
    const inner    = smoothstep(f0 + 0.12, f0 + 0.42, wave)
    const meridian = smoothstep(f0 + 0.18, f0 + 0.52, wave)
    const facade   = smoothstep(f0 + 0.22, f0 + 0.58, wave)
    const brace    = smoothstep(f0 + 0.32, f0 + 0.74, wave)
    const band     = smoothstep(f0 + 0.44, f0 + 0.84, wave)
    setLineOpacity(refs.slab.current,     slab,    0.90)
    setLineOpacity(refs.cornice.current,  cornice, 0.60)
    setLineOpacity(refs.balcony.current,  balcony, 0.52)
    setLineOpacity(refs.inner.current,    inner,   0.50)
    setLineOpacity(refs.meridians.current,meridian,0.40)
    setLineOpacity(refs.facade.current,   facade,  0.30)
    setLineOpacity(refs.brace.current,    brace,   0.46)
    setLineOpacity(refs.band.current,     band,    0.36)
    setLineOpacity(refs.spandrel.current, band*0.7,0.28)
  })

  return (
    <group position={[0, y, 0]}>
      <lineLoop ref={refs.cornice} geometry={corniceGeo}><lineBasicMaterial color={ACCENT} transparent opacity={0}/></lineLoop>
      <lineLoop ref={refs.slab} geometry={slabGeo}><lineBasicMaterial color={ACCENT_SOFT} transparent opacity={0}/></lineLoop>
      <lineLoop ref={refs.balcony} geometry={balconyGeo}><lineBasicMaterial color={ACCENT_DIM} transparent opacity={0}/></lineLoop>
      <lineLoop ref={refs.inner} geometry={innerGeo}><lineBasicMaterial color={STEEL_BRIGHT} transparent opacity={0}/></lineLoop>
      <group ref={refs.meridians}>
        {meridianGeos.map((g, i) => (
          <lineSegments key={i} geometry={g}><lineBasicMaterial color={ACCENT_DIM} transparent opacity={0}/></lineSegments>
        ))}
      </group>
      <lineSegments ref={refs.facade} geometry={facadeGeo}><lineBasicMaterial color={GLASS} transparent opacity={0}/></lineSegments>
      <lineSegments ref={refs.brace} geometry={braceGeo}><lineBasicMaterial color={STEEL} transparent opacity={0}/></lineSegments>
      <lineLoop ref={refs.band} geometry={bandGeo}><lineBasicMaterial color={ACCENT_DIM} transparent opacity={0}/></lineLoop>
      <lineLoop ref={refs.spandrel} geometry={spandrelGeo}><lineBasicMaterial color={GLASS} transparent opacity={0}/></lineLoop>
    </group>
  )
}

function TowerSpire({ y }: { y: number }) {
  const refs = { spine: useRef<THREE.LineSegments>(null), rings: useRef<THREE.Group>(null), antenna: useRef<THREE.LineSegments>(null) }
  const { rx, rz } = towerPlan(TOWER_FLOORS - 1)

  const spineGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, y, 0), new THREE.Vector3(0, y + 1.2, 0),
  ]), [y])

  const ringGeos = useMemo(() => {
    const list: THREE.BufferGeometry[] = []
    for (let i = 0; i < 8; i++) {
      const t2 = i / 7
      const r = rx * 0.5 * (1 - t2 * 0.9)
      list.push(createLoop(r, r * (rz / rx), y + t2 * 0.85, 32, 3.0))
    }
    return list
  }, [y, rx, rz])

  const antennaGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, y + 0.85, 0), new THREE.Vector3(0.06, y + 1.05, 0),
    new THREE.Vector3(0.06, y + 1.05, 0), new THREE.Vector3(0, y + 1.18, 0),
  ]), [y])

  useFrame((state) => {
    const cs = getCycleState(state.clock.elapsedTime)
    const wave = cs.completeness * (TOWER_FLOORS + 0.7) + 0.05
    const f0 = TOWER_FLOORS * 0.88
    const v = smoothstep(f0 + 0.1, f0 + 0.7, wave)
    setLineOpacity(refs.spine.current, v, 0.72)
    setLineOpacity(refs.rings.current, v, 0.5)
    setLineOpacity(refs.antenna.current, v, 0.55)
  })

  return (
    <group>
      <lineSegments ref={refs.spine} geometry={spineGeo}><lineBasicMaterial color={ACCENT} transparent opacity={0}/></lineSegments>
      <group ref={refs.rings}>
        {ringGeos.map((g, i) => <lineLoop key={i} geometry={g}><lineBasicMaterial color={ACCENT_SOFT} transparent opacity={0}/></lineLoop>)}
      </group>
      <lineSegments ref={refs.antenna} geometry={antennaGeo}><lineBasicMaterial color={ACCENT_DIM} transparent opacity={0}/></lineSegments>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILDING B — Art Deco Stepped Tower (left)
// Inspired by: Chrysler Building, Empire State, setback zoning
// ═══════════════════════════════════════════════════════════════════════════════
const DECO_FLOORS = 10
const DECO_FH = 0.46

function decoSetback(floor: number): { rx: number; rz: number } {
  // Dramatic setbacks at floors 3, 6, 9
  if (floor < 3)  return { rx: 0.68, rz: 0.52 }
  if (floor < 6)  return { rx: 0.54, rz: 0.40 }
  if (floor < 9)  return { rx: 0.40, rz: 0.30 }
  return { rx: 0.26, rz: 0.20 }
}

function DecoFloor({ floor }: { floor: number }) {
  const y = floor * DECO_FH
  const { rx, rz } = decoSetback(floor)
  const isSetback = floor === 3 || floor === 6 || floor === 9

  const refs = {
    slab: useRef<THREE.LineLoop>(null),
    ornament: useRef<THREE.Group>(null),
    arcade: useRef<THREE.LineSegments>(null),
    pilaster: useRef<THREE.LineSegments>(null),
    dentil: useRef<THREE.LineSegments>(null),
  }

  const slabGeo = useMemo(() => createLoop(rx, rz, 0.012, 48, 5.5), [rx, rz])

  // Ornamental setback shelf
  const ornamentGeos = useMemo(() => {
    if (!isSetback) return []
    const { rx: prx, rz: prz } = decoSetback(floor - 1)
    return [
      createLoop(prx * 1.04, prz * 1.04, -0.02, 48, 5.5),
      createLoop(prx * 1.02, prz * 1.02, -0.06, 48, 5.5),
      createLoop(prx * 0.98, prz * 0.98, -0.10, 44, 5.5),
    ]
  }, [floor, isSetback])

  // Vertical pilasters (corner columns)
  const pilasterGeo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const corners = [0, 1, 2, 3].map(i => (i / 4) * Math.PI * 2 + Math.PI / 4)
    for (const th of corners) {
      const b = superellipse(th, rx * 1.01, rz * 1.01, 5.5)
      pts.push(new THREE.Vector3(b.x, 0.02, b.z), new THREE.Vector3(b.x, DECO_FH - 0.02, b.z))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [rx, rz])

  // Arcade windows
  const arcadeGeo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const n = 12
    for (let i = 0; i < n; i++) {
      const th0 = (i / n) * Math.PI * 2
      const th1 = ((i + 0.5) / n) * Math.PI * 2
      const b0 = superellipse(th0, rx * 0.97, rz * 0.97, 5.5)
      const b1 = superellipse(th1, rx * 0.97, rz * 0.97, 5.5)
      // Vertical mullion
      pts.push(new THREE.Vector3(b0.x, DECO_FH * 0.15, b0.z), new THREE.Vector3(b0.x, DECO_FH * 0.82, b0.z))
      // Arch apex
      const mid = superellipse((th0 + th1) / 2, rx * 0.97 * 1.006, rz * 0.97 * 1.006, 5.5)
      pts.push(new THREE.Vector3(b0.x, DECO_FH * 0.72, b0.z), new THREE.Vector3(mid.x, DECO_FH * 0.84, mid.z))
      pts.push(new THREE.Vector3(mid.x, DECO_FH * 0.84, mid.z), new THREE.Vector3(b1.x, DECO_FH * 0.72, b1.z))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [rx, rz])

  // Dentil cornice detail
  const dentilGeo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const n = 36
    for (let i = 0; i < n; i++) {
      const th = (i / n) * Math.PI * 2
      const b = superellipse(th, rx * 0.99, rz * 0.99, 5.5)
      const isBlock = i % 2 === 0
      const yOff = isBlock ? 0.005 : -0.005
      pts.push(new THREE.Vector3(b.x, DECO_FH * 0.9 + yOff, b.z), new THREE.Vector3(b.x, DECO_FH - 0.01 + yOff, b.z))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [rx, rz])

  useFrame((state) => {
    const cs = getCycleState(state.clock.elapsedTime)
    const wave = cs.completeness * (DECO_FLOORS + 0.7)
    const f0 = floor * 0.88
    const v = smoothstep(f0 + 0.02, f0 + 0.38, wave)
    const v2 = smoothstep(f0 + 0.18, f0 + 0.58, wave)
    setLineOpacity(refs.slab.current,    v,  0.88)
    setLineOpacity(refs.ornament.current,v,  0.62)
    setLineOpacity(refs.pilaster.current,v2, 0.50)
    setLineOpacity(refs.arcade.current,  v2, 0.40)
    setLineOpacity(refs.dentil.current,  v2, 0.36)
  })

  return (
    <group position={[0, y, 0]}>
      <lineLoop ref={refs.slab} geometry={slabGeo}><lineBasicMaterial color={ACCENT_SOFT} transparent opacity={0}/></lineLoop>
      <group ref={refs.ornament}>
        {ornamentGeos.map((g, i) => <lineLoop key={i} geometry={g}><lineBasicMaterial color={ACCENT} transparent opacity={0}/></lineLoop>)}
      </group>
      <lineSegments ref={refs.pilaster} geometry={pilasterGeo}><lineBasicMaterial color={ACCENT_DIM} transparent opacity={0}/></lineSegments>
      <lineSegments ref={refs.arcade} geometry={arcadeGeo}><lineBasicMaterial color={CONCRETE} transparent opacity={0}/></lineSegments>
      <lineSegments ref={refs.dentil} geometry={dentilGeo}><lineBasicMaterial color={ACCENT_DIM} transparent opacity={0}/></lineSegments>
    </group>
  )
}

function DecoCrown({ y }: { y: number }) {
  const ref = useRef<THREE.Group>(null)
  const geos = useMemo(() => {
    const list: THREE.BufferGeometry[] = []
    // Eagle-wing sunburst crown
    for (let i = 0; i < 5; i++) {
      const t2 = i / 4
      const r = 0.22 * (1 - t2 * 0.85)
      list.push(createLoop(r, r * 0.75, y + t2 * 0.62, 32, 4.5))
    }
    // Vertical fin lines
    for (const th of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
      list.push(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Math.cos(th) * 0.22, y, Math.sin(th) * 0.16),
        new THREE.Vector3(Math.cos(th) * 0.06, y + 0.62, Math.sin(th) * 0.04),
      ]))
    }
    // Needle
    list.push(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, y + 0.62, 0),
      new THREE.Vector3(0, y + 1.05, 0),
    ]))
    return list
  }, [y])

  useFrame((state) => {
    const cs = getCycleState(state.clock.elapsedTime)
    const wave = cs.completeness * (DECO_FLOORS + 0.7)
    const v = smoothstep(DECO_FLOORS * 0.88, DECO_FLOORS * 0.88 + 0.7, wave)
    setLineOpacity(ref.current, v, 0.6)
  })

  return (
    <group ref={ref}>
      {geos.map((g, i) => <lineSegments key={i} geometry={g}><lineBasicMaterial color={ACCENT} transparent opacity={0}/></lineSegments>)}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILDING C — Twisted Glass Skyscraper (right)
// Inspired by: Shanghai Tower, Cayan Tower, Infinity Tower
// ═══════════════════════════════════════════════════════════════════════════════
const TWIST_FLOORS = 11
const TWIST_FH = 0.48
const TWIST_RX = 0.72
const TWIST_RZ = 0.56
const MAX_TWIST = Math.PI * 0.72  // total rotation over height

function TwistFloor({ floor }: { floor: number }) {
  const y = floor * TWIST_FH
  const t2 = floor / (TWIST_FLOORS - 1)
  const twistAngle = t2 * MAX_TWIST
  const taper = 1 - t2 * 0.28
  const rx = TWIST_RX * taper
  const rz = TWIST_RZ * taper
  const nextT = (floor + 1) / (TWIST_FLOORS - 1)
  const nextAngle = nextT * MAX_TWIST
  const nextTaper = 1 - nextT * 0.28
  const nrx = TWIST_RX * nextTaper
  const nrz = TWIST_RZ * nextTaper

  const refs = {
    slab: useRef<THREE.Group>(null),
    curtainWall: useRef<THREE.LineSegments>(null),
    diagonals: useRef<THREE.LineSegments>(null),
    ring: useRef<THREE.LineLoop>(null),
    innerCore: useRef<THREE.LineLoop>(null),
  }

  // Rotated superellipse slab (triangle-ish with 3.0 exponent — "aerodynamic")
  const slabGeo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const n = 64
    for (let i = 0; i < n; i++) {
      const u = (i / n) * Math.PI * 2 + twistAngle
      const p = superellipse(u, rx, rz, 3.0)
      pts.push(new THREE.Vector3(p.x, 0.01, p.z))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [rx, rz, twistAngle])

  const outerRingGeo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const n = 56
    for (let i = 0; i < n; i++) {
      const u = (i / n) * Math.PI * 2 + twistAngle
      const p = superellipse(u, rx * 1.02, rz * 1.02, 3.0)
      pts.push(new THREE.Vector3(p.x, 0.0, p.z))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [rx, rz, twistAngle])

  const innerCoreGeo = useMemo(() => createLoop(rx * 0.22, rz * 0.22, TWIST_FH * 0.5, 32, 4.0), [rx, rz])

  // Curtain wall panels — diagonal glass lines following the twist
  const curtainGeo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const n = 32
    for (let i = 0; i < n; i++) {
      const u0 = (i / n) * Math.PI * 2 + twistAngle
      const u1 = ((i + 1) / n) * Math.PI * 2 + twistAngle
      const uMid = (u0 + nextAngle) * 0.5 + Math.PI / n
      const b0 = superellipse(u0,   rx,  rz,  3.0)
      const b1 = superellipse(u1,   rx,  rz,  3.0)
      const t0 = superellipse(uMid, nrx, nrz, 3.0)
      // Diagonal: bottom-left → top-mid
      pts.push(new THREE.Vector3(b0.x, 0.04, b0.z), new THREE.Vector3(t0.x, TWIST_FH - 0.04, t0.z))
      // Horizontal spandrel at 40%, 70%
      for (const h of [0.4, 0.7]) {
        const interp = h
        const ux = twistAngle + (nextAngle - twistAngle) * interp
        const ir  = rx + (nrx - rx) * interp
        const irz = rz + (nrz - rz) * interp
        const c0 = superellipse(u0 + (nextAngle - twistAngle) * interp, ir, irz, 3.0)
        const c1 = superellipse(u1 + (nextAngle - twistAngle) * interp, ir, irz, 3.0)
        pts.push(new THREE.Vector3(c0.x, TWIST_FH * h, c0.z), new THREE.Vector3(c1.x, TWIST_FH * h, c1.z))
      }
      void uMid, b1 // suppress unused
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [rx, rz, nrx, nrz, twistAngle, nextAngle])

  // External diagonal X-braces on 4 faces
  const diagonalGeo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const nFace = 4
    for (let fi = 0; fi < nFace; fi++) {
      const th0 = (fi / nFace) * Math.PI * 2 + twistAngle
      const th1 = ((fi + 1) / nFace) * Math.PI * 2 + twistAngle
      const a = superellipse(th0, rx, rz, 3.0)
      const b = superellipse(th1, rx, rz, 3.0)
      const c = superellipse(th0 + (nextAngle - twistAngle), nrx, nrz, 3.0)
      const d = superellipse(th1 + (nextAngle - twistAngle), nrx, nrz, 3.0)
      pts.push(new THREE.Vector3(a.x, 0.04, a.z), new THREE.Vector3(d.x, TWIST_FH - 0.04, d.z))
      pts.push(new THREE.Vector3(b.x, 0.04, b.z), new THREE.Vector3(c.x, TWIST_FH - 0.04, c.z))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [rx, rz, nrx, nrz, twistAngle, nextAngle])

  useFrame((state) => {
    const cs = getCycleState(state.clock.elapsedTime)
    const wave = cs.completeness * (TWIST_FLOORS + 0.7)
    const f0 = floor * 0.88
    const v  = smoothstep(f0 + 0.02, f0 + 0.35, wave)
    const v2 = smoothstep(f0 + 0.15, f0 + 0.55, wave)
    const v3 = smoothstep(f0 + 0.28, f0 + 0.68, wave)
    setLineOpacity(refs.slab.current,       v,  0.90)
    setLineOpacity(refs.ring.current,       v,  0.55)
    setLineOpacity(refs.innerCore.current,  v2, 0.48)
    setLineOpacity(refs.curtainWall.current,v2, 0.30)
    setLineOpacity(refs.diagonals.current,  v3, 0.52)
  })

  return (
    <group position={[0, y, 0]}>
      <group ref={refs.slab}>
        <lineLoop geometry={slabGeo}><lineBasicMaterial color={ACCENT_SOFT} transparent opacity={0}/></lineLoop>
      </group>
      <lineLoop ref={refs.ring} geometry={outerRingGeo}><lineBasicMaterial color={ACCENT_DIM} transparent opacity={0}/></lineLoop>
      <lineLoop ref={refs.innerCore} geometry={innerCoreGeo}><lineBasicMaterial color={STEEL_BRIGHT} transparent opacity={0}/></lineLoop>
      <lineSegments ref={refs.curtainWall} geometry={curtainGeo}><lineBasicMaterial color={GLASS_LIGHT} transparent opacity={0}/></lineSegments>
      <lineSegments ref={refs.diagonals} geometry={diagonalGeo}><lineBasicMaterial color={ACCENT_SOFT} transparent opacity={0}/></lineSegments>
    </group>
  )
}

function TwistTop({ y }: { y: number }) {
  const ref = useRef<THREE.Group>(null)
  const t2 = 1.0
  const angle = t2 * MAX_TWIST
  const taper = 0.72

  const geos = useMemo(() => {
    const list: THREE.BufferGeometry[] = []
    for (let i = 0; i < 6; i++) {
      const frac = i / 5
      const r = TWIST_RX * taper * (1 - frac * 0.88)
      const rz = TWIST_RZ * taper * (1 - frac * 0.88)
      const loopY = y + frac * 0.55
      const th = angle + frac * 0.4
      const pts: THREE.Vector3[] = []
      const n = 32
      for (let j = 0; j < n; j++) {
        const u = (j / n) * Math.PI * 2 + th
        const p = superellipse(u, r, rz, 3.0)
        pts.push(new THREE.Vector3(p.x, loopY, p.z))
      }
      list.push(new THREE.BufferGeometry().setFromPoints(pts))
    }
    // Vertical spine
    list.push(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, y, 0), new THREE.Vector3(0, y + 0.55, 0),
    ]))
    return list
  }, [y, angle, taper])

  useFrame((state) => {
    const cs = getCycleState(state.clock.elapsedTime)
    const wave = cs.completeness * (TWIST_FLOORS + 0.7)
    const v = smoothstep(TWIST_FLOORS * 0.88, TWIST_FLOORS * 0.88 + 0.6, wave)
    setLineOpacity(ref.current, v, 0.55)
  })

  return (
    <group ref={ref}>
      {geos.map((g, i) => <lineSegments key={i} geometry={g}><lineBasicMaterial color={ACCENT} transparent opacity={0}/></lineSegments>)}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILDING D — Low-rise Modernist Podium (background left)
// Inspired by: mid-century horizontal campus buildings, Mies van der Rohe
// ═══════════════════════════════════════════════════════════════════════════════
const PODIUM_FLOORS = 4
const PODIUM_FH = 0.38

function PodiumBuilding() {
  const ref = useRef<THREE.Group>(null)

  const geos = useMemo(() => {
    const list: THREE.BufferGeometry[] = []
    const W = 1.35, D = 0.55

    for (let f = 0; f <= PODIUM_FLOORS; f++) {
      const y = f * PODIUM_FH
      // Rectangular floor slab
      const pts = [
        new THREE.Vector3(-W, y, -D), new THREE.Vector3(W, y, -D),
        new THREE.Vector3(W, y, -D), new THREE.Vector3(W, y, D),
        new THREE.Vector3(W, y, D), new THREE.Vector3(-W, y, D),
        new THREE.Vector3(-W, y, D), new THREE.Vector3(-W, y, -D),
      ]
      list.push(new THREE.BufferGeometry().setFromPoints(pts))

      if (f < PODIUM_FLOORS) {
        // Column grid
        const cols = 7, rows = 2
        for (let ci = 0; ci <= cols; ci++) {
          const x = -W + (ci / cols) * W * 2
          for (let ri = 0; ri <= rows; ri++) {
            const z = -D + (ri / rows) * D * 2
            list.push(new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(x, y + 0.02, z),
              new THREE.Vector3(x, y + PODIUM_FH - 0.02, z),
            ]))
          }
        }
        // Horizontal ribbon windows
        for (const frac of [0.3, 0.55, 0.78]) {
          const yw = y + PODIUM_FH * frac
          list.push(new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-W * 0.96, yw, -D * 0.99),
            new THREE.Vector3(W * 0.96, yw, -D * 0.99),
          ]))
          list.push(new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-W * 0.96, yw, D * 0.99),
            new THREE.Vector3(W * 0.96, yw, D * 0.99),
          ]))
        }
      }
    }

    // Canopy / brise-soleil
    const cy = PODIUM_FLOORS * PODIUM_FH + 0.08
    const fins = 14
    for (let i = 0; i <= fins; i++) {
      const x = -W + (i / fins) * W * 2
      list.push(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, cy, -D * 1.05), new THREE.Vector3(x, cy, D * 1.05),
      ]))
    }

    return list
  }, [])

  useFrame((state) => {
    const cs = getCycleState(state.clock.elapsedTime)
    const v = smoothstepV(cs.completeness, 0.04, 0.48)
    setLineOpacity(ref.current, v, 0.48)
  })

  return (
    <group ref={ref} position={[-2.65, 0, 0.4]} rotation={[0, 0.15, 0]}>
      {geos.map((g, i) => (
        <lineSegments key={i} geometry={g}>
          <lineBasicMaterial color={i % 5 === 0 ? ACCENT_DIM : CONCRETE} transparent opacity={0}/>
        </lineSegments>
      ))}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILDING E — Industrial Warehouse / Shed (background right)
// Inspired by: barrel-vault factories, Grimshaw, Rogers industrial
// ═══════════════════════════════════════════════════════════════════════════════
function WarehouseBuilding() {
  const ref = useRef<THREE.Group>(null)

  const geos = useMemo(() => {
    const list: THREE.BufferGeometry[] = []
    const W = 1.05, D = 0.72, H = 0.82

    // Base perimeter
    list.push(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-W, 0, -D), new THREE.Vector3(W, 0, -D),
      new THREE.Vector3(W, 0, -D), new THREE.Vector3(W, 0, D),
      new THREE.Vector3(W, 0, D),  new THREE.Vector3(-W, 0, D),
      new THREE.Vector3(-W, 0, D), new THREE.Vector3(-W, 0, -D),
    ]))

    // Barrel-vault roof arches (transverse)
    const archN = 12
    for (let i = 0; i <= archN; i++) {
      const x = -W + (i / archN) * W * 2
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(x, H * 0.88, -D),
        new THREE.Vector3(x, H * 1.38, 0),
        new THREE.Vector3(x, H * 0.88, D),
      )
      list.push(segsFromPoints(curve.getPoints(18)))
    }

    // Longitudinal purlins
    for (const z of [-D * 0.88, -D * 0.44, 0, D * 0.44, D * 0.88]) {
      list.push(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-W, H * 0.88, z), new THREE.Vector3(W, H * 0.88, z),
      ]))
    }

    // Ridge beam
    list.push(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-W, H * 1.38, 0), new THREE.Vector3(W, H * 1.38, 0),
    ]))

    // Vertical columns
    const cols = 5
    for (let i = 0; i <= cols; i++) {
      const x = -W + (i / cols) * W * 2
      for (const z of [-D, D]) {
        list.push(new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, 0, z), new THREE.Vector3(x, H * 0.88, z),
        ]))
      }
    }

    // Window/louvre strips
    for (let i = 1; i < cols; i++) {
      const x = -W + (i / cols) * W * 2
      for (const frac of [0.28, 0.56, 0.78]) {
        list.push(new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x - W * 0.12, H * frac, -D * 1.001),
          new THREE.Vector3(x + W * 0.12, H * frac, -D * 1.001),
        ]))
      }
    }

    // Loading dock protrusion
    list.push(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-W * 0.45, 0, D), new THREE.Vector3(-W * 0.45, H * 0.42, D * 1.28),
      new THREE.Vector3(-W * 0.45, H * 0.42, D * 1.28), new THREE.Vector3(W * 0.45, H * 0.42, D * 1.28),
      new THREE.Vector3(W * 0.45, H * 0.42, D * 1.28), new THREE.Vector3(W * 0.45, 0, D),
      new THREE.Vector3(-W * 0.45, H * 0.42, D * 1.28), new THREE.Vector3(-W * 0.45, 0, D * 1.28),
      new THREE.Vector3(W * 0.45, H * 0.42, D * 1.28), new THREE.Vector3(W * 0.45, 0, D * 1.28),
    ]))

    return list
  }, [])

  useFrame((state) => {
    const cs = getCycleState(state.clock.elapsedTime)
    const v = smoothstepV(cs.completeness, 0.06, 0.52)
    setLineOpacity(ref.current, v, 0.44)
  })

  return (
    <group ref={ref} position={[2.8, 0, 0.55]} rotation={[0, -0.18, 0]}>
      {geos.map((g, i) => (
        <lineSegments key={i} geometry={g}>
          <lineBasicMaterial color={i < 3 ? ACCENT_DIM : STEEL} transparent opacity={0}/>
        </lineSegments>
      ))}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILDING F — Parametric Diagrid Mid-Rise (far background)
// Inspired by: Swiss Re (Gherkin), Hearst Tower, CCTV
// ═══════════════════════════════════════════════════════════════════════════════
const DIAGRID_FLOORS = 7
const DIAGRID_FH = 0.44

function DiagridBuilding() {
  const ref = useRef<THREE.Group>(null)

  const geos = useMemo(() => {
    const list: THREE.BufferGeometry[] = []
    const BASE_R = 0.50
    const BASE_RZ2 = 0.38

    // Floor slabs
    for (let f = 0; f <= DIAGRID_FLOORS; f++) {
      const t2 = f / DIAGRID_FLOORS
      const taper = 1 - t2 * 0.35 + Math.sin(t2 * Math.PI) * 0.06
      const r = BASE_R * taper
      const rz2 = BASE_RZ2 * taper
      const y = f * DIAGRID_FH
      const pts: THREE.Vector3[] = []
      const n = 52
      for (let i = 0; i < n; i++) {
        const u = (i / n) * Math.PI * 2
        const p = superellipse(u, r, rz2, 3.5)
        pts.push(new THREE.Vector3(p.x, y, p.z))
      }
      list.push(new THREE.BufferGeometry().setFromPoints(pts))
    }

    // Diagrid panels — diamond lattice climbing the facade
    const NODES = 16 // nodes per floor
    for (let f = 0; f < DIAGRID_FLOORS; f++) {
      const t0 = f / DIAGRID_FLOORS, t1 = (f + 1) / DIAGRID_FLOORS
      const tap0 = 1 - t0 * 0.35 + Math.sin(t0 * Math.PI) * 0.06
      const tap1 = 1 - t1 * 0.35 + Math.sin(t1 * Math.PI) * 0.06
      const r0 = BASE_R * tap0, rz0 = BASE_RZ2 * tap0
      const r1 = BASE_R * tap1, rz1 = BASE_RZ2 * tap1
      const y0 = f * DIAGRID_FH, y1 = (f + 1) * DIAGRID_FH

      for (let n = 0; n < NODES; n++) {
        const th0 = (n / NODES) * Math.PI * 2
        const th1 = ((n + 1) / NODES) * Math.PI * 2
        const a = superellipse(th0, r0, rz0, 3.5)
        const b = superellipse(th1, r0, rz0, 3.5)
        const c = superellipse((th0 + th1) / 2, r1, rz1, 3.5)
        list.push(new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(a.x, y0, a.z), new THREE.Vector3(c.x, y1, c.z),
          new THREE.Vector3(b.x, y0, b.z), new THREE.Vector3(c.x, y1, c.z),
        ]))
      }
    }

    // Cupola top
    const topY = DIAGRID_FLOORS * DIAGRID_FH
    for (let i = 0; i < 5; i++) {
      const frac = i / 4
      const r = BASE_R * 0.65 * (1 - frac * 0.9)
      const rz2 = BASE_RZ2 * 0.65 * (1 - frac * 0.9)
      const pts: THREE.Vector3[] = []
      const n = 32
      for (let j = 0; j < n; j++) {
        const u = (j / n) * Math.PI * 2
        const p = superellipse(u, r, rz2, 3.5)
        pts.push(new THREE.Vector3(p.x, topY + frac * 0.38, p.z))
      }
      list.push(new THREE.BufferGeometry().setFromPoints(pts))
    }

    return list
  }, [])

  useFrame((state) => {
    const cs = getCycleState(state.clock.elapsedTime)
    const v = smoothstepV(cs.completeness, 0.05, 0.50)
    setLineOpacity(ref.current, v, 0.38)
  })

  return (
    <group ref={ref} position={[-1.6, 0, -1.4]} rotation={[0, 0.25, 0]}>
      {geos.map((g, i) => (
        <lineSegments key={i} geometry={g}>
          <lineBasicMaterial color={i < DIAGRID_FLOORS + 1 ? ACCENT_SOFT : COPPER} transparent opacity={0}/>
        </lineSegments>
      ))}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED GHOST + FOUNDATION
// ═══════════════════════════════════════════════════════════════════════════════
function CityGhostShell() {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    // Big silhouette ghost — just faint height lines of all towers
    const configs = [
      { x: 0,   z: 0,    h: TOWER_FLOORS * TOWER_FH, r: 0.92 },
      { x: -1.7, z: 0.2, h: DECO_FLOORS * DECO_FH,   r: 0.72 },
      { x: 1.85, z: 0.15,h: TWIST_FLOORS * TWIST_FH, r: 0.76 },
    ]
    for (const cfg of configs) {
      const n = 18
      for (let m = 0; m < n; m++) {
        const th = (m / n) * Math.PI * 2
        pts.push(
          new THREE.Vector3(cfg.x + Math.cos(th) * cfg.r, 0, cfg.z + Math.sin(th) * cfg.r * 0.75),
          new THREE.Vector3(cfg.x + Math.cos(th) * cfg.r, cfg.h, cfg.z + Math.sin(th) * cfg.r * 0.75),
        )
      }
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [])

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color={GHOST} transparent opacity={0.03} depthWrite={false}/>
    </lineSegments>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ASSEMBLY
// ═══════════════════════════════════════════════════════════════════════════════
export function HeroBuildAssembly() {
  const root = useRef<THREE.Group>(null)

  useFrame((state) => {
    const g = root.current
    if (!g) return
    const t = state.clock.elapsedTime
    // Slow majestic orbit
    g.rotation.y = t * 0.055 + Math.sin(t * 0.09) * 0.018
    g.position.y = Math.sin(t * 0.13) * 0.03
    const cam = state.camera
    cam.position.x = Math.sin(t * 0.055) * 0.38
    cam.position.y = 3.8 + Math.sin(t * 0.1) * 0.1
    cam.position.z = 12.5 + Math.cos(t * 0.07) * 0.22
    cam.lookAt(0, 2.9, 0)
  })

  const towerH  = TOWER_FLOORS  * TOWER_FH
  const decoH   = DECO_FLOORS   * DECO_FH
  const twistH  = TWIST_FLOORS  * TWIST_FH

  return (
    <group ref={root}>
      <GroundGrid />
      <CityGhostShell />

      {/* ── Center: Curved Modernist Tower ── */}
      <group position={[0, 0, 0]}>
        {Array.from({ length: TOWER_FLOORS }, (_, f) => <TowerFloor key={f} floor={f} />)}
        <TowerSpire y={towerH} />
      </group>

      {/* ── Left: Art Deco Stepped ── */}
      <group position={[-1.72, 0, 0.18]}>
        {Array.from({ length: DECO_FLOORS }, (_, f) => <DecoFloor key={f} floor={f} />)}
        <DecoCrown y={decoH} />
      </group>

      {/* ── Right: Twisted Glass Skyscraper ── */}
      <group position={[1.88, 0, 0.12]}>
        {Array.from({ length: TWIST_FLOORS }, (_, f) => <TwistFloor key={f} floor={f} />)}
        <TwistTop y={twistH} />
      </group>

      {/* ── Background buildings ── */}
      <PodiumBuilding />
      <WarehouseBuilding />
      <DiagridBuilding />
    </group>
  )
}