import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { BannerParticleField } from './BannerParticleField'

export function BannerParticleCanvas() {
  return (
    <div className="absolute inset-0 h-full w-full">
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 55, near: 0.1, far: 80 }}
          dpr={[1, 1.5]}
          gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
        >
          <color attach="background" args={['#050504']} />
          <BannerParticleField />
        </Canvas>
      </Suspense>
    </div>
  )
}
