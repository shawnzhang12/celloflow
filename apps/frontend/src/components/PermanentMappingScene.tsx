import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import CelloModel from './CelloModel';
import type { StringName, Note } from '../types';
import { getNotePosition, getStringPositions, getCelloScale, hasMapping } from '../utils/celloMapping';
import React from 'react';

const STRING_COLORS: Record<StringName, string> = {
  C: '#FF4C4C',
  G: '#00FF77',
  D: '#FFD700',
  A: '#00AFFF',
};

// Test notes that will use the permanent mapping
const TEST_NOTES: Note[] = [
  { id: '1', string: 'A', bin: 0, startTime: 0, duration: 1 },
  { id: '2', string: 'A', bin: 3, startTime: 1, duration: 1 },
  { id: '3', string: 'D', bin: 2, startTime: 2, duration: 1 },
  { id: '4', string: 'G', bin: 5, startTime: 3, duration: 1 },
  { id: '5', string: 'C', bin: 1, startTime: 4, duration: 1 },
];

interface FallingNote3DProps {
  note: Note;
  currentTime: number;
  onImpact?: (note: Note) => void;
}

function FallingNote3D({ note, currentTime, onImpact }: FallingNote3DProps) {
  const [hasImpacted, setHasImpacted] = useState(false);
  
  // Get the permanent 3D position for this note
  const position = getNotePosition(note);
  if (!position) return null;

  const elapsed = currentTime - note.startTime;
  if (elapsed < -2) return null; // Not started yet

  // Calculate falling animation
  const fallDistance = 10; // Distance to fall
  const fallSpeed = 5; // units per second
  const startY = position.y + fallDistance;
  const currentY = startY - elapsed * fallSpeed;
  
  // Check for impact
  const isImpact = currentY <= position.y && !hasImpacted;
  if (isImpact) {
    setHasImpacted(true);
    onImpact?.(note);
  }

  // Remove note if it's fallen too far
  if (currentY < position.y - 2) return null;

  return (
    <mesh position={[position.x, currentY, position.z]}>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshStandardMaterial 
        color={STRING_COLORS[note.string]} 
        emissive={isImpact ? STRING_COLORS[note.string] : '#000000'}
        emissiveIntensity={isImpact ? 0.5 : 0}
      />
    </mesh>
  );
}

interface StringPositionMarkerProps {
  string: StringName;
}

function StringPositionMarker({ string }: StringPositionMarkerProps) {
  const positions = getStringPositions(string);
  
  return (
    <>
      {positions.map((pos, index) => (
        <mesh key={`${string}-${index}`} position={[pos.x, pos.y, pos.z]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color={STRING_COLORS[string]} opacity={0.3} transparent />
        </mesh>
      ))}
    </>
  );
}

export default function PermanentMappingScene() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [impactedNotes, setImpactedNotes] = useState<Set<string>>(new Set());

  const startRef = useRef<number | null>(null);
  const pauseOffset = useRef<number>(0);
  const rafId = useRef<number>();

  // Play / pause toggle
  const togglePlay = () => {
    if (isRunning) {
      setIsRunning(false);
      pauseOffset.current = currentTime;
      if (rafId.current) cancelAnimationFrame(rafId.current!);
    } else {
      startRef.current = null;
      setIsRunning(true);
    }
  };

  // Reset animation
  const resetAnimation = () => {
    setCurrentTime(0);
    setImpactedNotes(new Set());
    pauseOffset.current = 0;
    startRef.current = null;
  };

  // RAF loop
  useEffect(() => {
    if (!isRunning) return;

    const raf = (ts: number) => {
      if (!startRef.current) startRef.current = ts - pauseOffset.current * 1000;
      setCurrentTime((ts - startRef.current) / 1000);
      rafId.current = requestAnimationFrame(raf);
    };
    rafId.current = requestAnimationFrame(raf);

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current!);
    };
  }, [isRunning]);

  const handleNoteImpact = (note: Note) => {
    setImpactedNotes(prev => new Set([...prev, note.id]));
  };

  // Check if mapping exists
  const mappingExists = hasMapping();
  const celloScale = getCelloScale();

  return (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={togglePlay} style={{ padding: '6px 16px', fontWeight: 600, fontSize: 15 }}>
          {isRunning ? 'Pause' : 'Play'}
        </button>
        <button onClick={resetAnimation} style={{ padding: '6px 16px', fontWeight: 600, fontSize: 15 }}>
          Reset
        </button>
        <span style={{ marginLeft: 12 }}>
          Time: {currentTime.toFixed(1)}s | Impacted: {impactedNotes.size}
        </span>
        {!mappingExists && (
          <span style={{ color: 'orange', marginLeft: 12 }}>
            ⚠️ No mapping found. Please export from Debug Scene first.
          </span>
        )}
      </div>
      
      <div style={{ width: '100%', height: 500 }}>
        <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} />
          
          {/* Cello model - will scale with the stored mapping */}
          <CelloModel position={[0, -1.5, 0]} scale={celloScale} />
          
          {/* String position markers */}
          {(['A', 'D', 'G', 'C'] as StringName[]).map(string => (
            <StringPositionMarker key={string} string={string} />
          ))}
          
          {/* Falling notes using permanent mapping */}
          {TEST_NOTES.map(note => (
            <FallingNote3D
              key={note.id}
              note={note}
              currentTime={currentTime}
              onImpact={handleNoteImpact}
            />
          ))}
          
          <OrbitControls enableZoom enablePan enableRotate />
        </Canvas>
      </div>
      
      <div style={{ marginTop: 12 }}>
        <h4>Permanent Mapping Features:</h4>
        <ul>
          <li>Each note has one definitive 3D position on the cello</li>
          <li>Positions scale automatically with the cello model</li>
          <li>Mapping is stored permanently and can be loaded/saved</li>
          <li>Notes fall from above and impact at their exact positions</li>
          <li>Mapping status: {mappingExists ? '✅ Loaded' : '❌ Not found'}</li>
        </ul>
      </div>
    </div>
  );
} 