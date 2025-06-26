import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

export default function FallingNote({ startTime, lane, stringColor, duration }: {
  startTime: number
  lane: number
  stringColor: string
  duration: number
}) {
  const mesh = useRef<THREE.Mesh>(null)
  const startZ = 20
  const endZ = -5

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime()
    const t = elapsed - startTime

    if (t >= 0 && t <= duration) {
      const z = startZ + (endZ - startZ) * (t / duration)
      if (mesh.current) {
        mesh.current.position.z = z
      }
    }
  })

  return (
    <mesh ref={mesh} position={[lane - 5, 0, startZ]}>
      <boxGeometry args={[0.8, 1, 0.3]} />
      <meshStandardMaterial color={stringColor} emissive={stringColor} emissiveIntensity={1.5} />
    </mesh>
  )
}
