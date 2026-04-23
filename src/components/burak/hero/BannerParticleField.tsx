import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COLS = 38
const ROWS = 22

export function BannerParticleField() {
  const points = useRef<THREE.Points>(null)
  const base = useRef<Float32Array>(new Float32Array(COLS * ROWS * 3))
  const pointer = useRef({ x: 0, y: 0 })

  const geometry = useMemo(() => {
    const pos = new Float32Array(COLS * ROWS * 3)
    let i = 0
    for (let cx = 0; cx < COLS; cx++) {
      for (let cy = 0; cy < ROWS; cy++) {
        const x = (cx / (COLS - 1) - 0.5) * 10.5
        const y = (cy / (ROWS - 1) - 0.5) * 5.8
        pos[i++] = x
        pos[i++] = y
        pos[i++] = 0
      }
    }
    base.current = new Float32Array(pos)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 10.5
      const ny = -((e.clientY / window.innerHeight) - 0.5) * 5.8
      pointer.current = { x: nx, y: ny }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useFrame((state) => {
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    const b = base.current
    const s = state.clock.elapsedTime * 0.55
    const { x: mx, y: my } = pointer.current
    let k = 0
    for (let i = 0; i < COLS * ROWS; i++) {
      const bx = b[k]
      const by = b[k + 1]
      const dx = bx - mx
      const dy = by - my
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.001
      const push = Math.max(0, 1.55 - dist) * 0.72
      const ang = Math.atan2(dy, dx)
      arr[k] = bx + Math.cos(ang) * push + Math.sin(s + i * 0.22) * 0.045
      arr[k + 1] = by + Math.sin(ang) * push + Math.cos(s * 0.82 + i * 0.16) * 0.04
      k += 3
    }
    attr.needsUpdate = true
    if (points.current) {
      points.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.08) * 0.02
    }
  })

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        color="#c8a96e"
        size={0.042}
        transparent
        opacity={0.52}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}
