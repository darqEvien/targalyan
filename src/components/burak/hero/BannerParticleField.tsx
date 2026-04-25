import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COLS = 40
const ROWS = 24

type PointerRef = React.MutableRefObject<{ nx: number; ny: number }>

export function BannerParticleField({ pointerRef }: { pointerRef: PointerRef }) {
  const points = useRef<THREE.Points>(null)

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
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3))
    g.userData.base = new Float32Array(pos)
    return g
  }, [])

  useFrame((state) => {
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    const b = geometry.userData.base as Float32Array
    const s = state.clock.elapsedTime * 0.52
    const { nx, ny } = pointerRef.current
    const mx = (nx - 0.5) * 10.5
    const my = -((ny - 0.5) * 5.8)
    let k = 0
    for (let i = 0; i < COLS * ROWS; i++) {
      const bx = b[k]
      const by = b[k + 1]
      const dx = bx - mx
      const dy = by - my
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.001
      const push = Math.max(0, 1.55 - dist) * 0.68
      const ang = Math.atan2(dy, dx)
      arr[k] = bx + Math.cos(ang) * push + Math.sin(s + i * 0.2) * 0.042
      arr[k + 1] = by + Math.sin(ang) * push + Math.cos(s * 0.8 + i * 0.15) * 0.038
      k += 3
    }
    attr.needsUpdate = true
    if (points.current) {
      points.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.075) * 0.018
    }
  })

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        color="#c8a96e"
        size={0.038}
        transparent
        opacity={0.48}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}
