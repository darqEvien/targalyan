import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { HeroBuildAssembly } from './HeroBuildAssembly'

export function HeroBuildCanvas() {
  return (
    <div className="absolute inset-0 h-full w-full">
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 3.35, 10.8], fov: 40, near: 0.1, far: 120 }}
          dpr={[1, 1.6]}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
            stencil: false,
          }}
        >
          <ambientLight intensity={0.22} />
          <directionalLight position={[6, 10, 8]} intensity={0.85} color="#fef3c7" />
          <directionalLight position={[-5, 2, -4]} intensity={0.18} color="#57534e" />
          <group position={[0, 0.35, 0]}>
            <HeroBuildAssembly />
          </group>
        </Canvas>
      </Suspense>
    </div>
  )
}
