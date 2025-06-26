// src/components/VisualScene.tsx
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import CelloModel from './CelloModel'

export default function VisualScene() {
  return (
    <Canvas
      orthographic
      camera={{ zoom: 60, position: [0, 8, 14] }}  // slight tilt
      shadows={false}
    >
      <color attach="background" args={['#0b0b0b']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 10]} intensity={1.2} />

      {/* async models */}
      <Suspense fallback={null}>
        <CelloModel scale={1.2} rotation={[-Math.PI / 2, 0, 0]} />
      </Suspense>
    </Canvas>
  )
}