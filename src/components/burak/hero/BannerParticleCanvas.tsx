import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import * as THREE from 'three'
import { BannerParticleField } from './BannerParticleField'

function ResizeToContainer({ containerRef }: { containerRef: React.RefObject<HTMLElement | null> }) {
  const { gl, camera } = useThree()
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const set = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w < 2 || h < 2) return
      gl.setSize(w, h)
      const c = camera as THREE.PerspectiveCamera
      c.aspect = w / h
      c.updateProjectionMatrix()
    }
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef, gl, camera])
  return null
}

type Props = {
  containerRef: React.RefObject<HTMLElement | null>
  pointerRef: React.MutableRefObject<{ nx: number; ny: number }>
}

export function BannerParticleCanvas({ containerRef, pointerRef }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 h-full w-full min-h-[50vh]">
      <Suspense fallback={null}>
        <Canvas
          className="h-full w-full"
          camera={{ position: [0, 0, 5], fov: 52, near: 0.1, far: 80 }}
          dpr={[1, 1.5]}
          gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
        >
          <color attach="background" args={['#050504']} />
          <ResizeToContainer containerRef={containerRef} />
          <BannerParticleField pointerRef={pointerRef} />
        </Canvas>
      </Suspense>
    </div>
  )
}
