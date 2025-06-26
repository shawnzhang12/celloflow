// src/components/CelloScene.tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import CelloModel from './CelloModel'
import FallingNote from './FallingNote'
import type { Note, StringName } from '../types'

interface CelloSceneProps {
  currentTime: number;
  notes: Note[];
  stringColors: Record<StringName, string>;
}

export default function CelloScene({ currentTime, notes, stringColors }: CelloSceneProps) {
  return (
    <div className="canvas-wrapper">
      <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} />
        <CelloModel position={[0, -1.5, 0]} scale={10.0} />
        {notes.map(note => {
          const elapsed = currentTime - note.startTime;
          if (elapsed < 0 || elapsed > note.duration) return null;
          return (
            <FallingNote
              key={note.id}
              startTime={note.startTime}
              lane={note.bin}
              stringColor={stringColors[note.string]}
              duration={note.duration}
            />
          );
        })}
        <OrbitControls enableZoom enablePan enableRotate />
      </Canvas>
    </div>
  )
}