import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import CelloModel from './CelloModel';
import type { StringName, Note } from '../types';
import { getNotePosition, getStringPositions, getCelloScale, hasMapping, exportMappingToFile, importMappingFromFile, loadMapping } from '../utils/celloMapping';
import { soundGenerator, initSound } from '../utils/soundGenerator';
import React from 'react';

const STRINGS: StringName[] = ['C', 'G', 'D', 'A'];
const POINTS_PER_STRING = 10;

const STRING_COLORS: Record<StringName, string> = {
  C: '#FF4C4C',
  G: '#00FF77',
  D: '#FFD700',
  A: '#00AFFF',
};

// Generate comprehensive test notes - one for every point on every string
function generateAllTestNotes(): Note[] {
  const notes: Note[] = [];
  let id = 1;
  let startTime = 0;
  
  // Test each string in order: C, G, D, A
  STRINGS.forEach((string, stringIndex) => {
    // Test each point on this string
    for (let bin = 0; bin < POINTS_PER_STRING; bin++) {
      notes.push({
        id: id.toString(),
        string,
        bin,
        startTime,
        duration: 2 // 2 seconds each
      });
      id++;
      startTime += 1.5; // 0.5 second gap between notes
    }
  });
  
  return notes;
}

// Test notes that will use the permanent mapping
const TEST_NOTES: Note[] = generateAllTestNotes();

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

  // Get the mapping to access tilt information
  const mapping = loadMapping();
  const tiltRad = mapping ? (mapping.tiltDeg * Math.PI) / 180 : 0;

  // Calculate falling animation perpendicular to the tilted cello
  const fallDistance = 10; // Distance to fall
  const fallSpeed = 5; // units per second
  
  // Start position: above the note position, perpendicular to the tilt
  const startY = position.y + fallDistance * Math.cos(tiltRad);
  const startZ = position.z - fallDistance * Math.sin(tiltRad);
  
  // Current position: falling perpendicular to the tilt
  const currentY = startY - elapsed * fallSpeed * Math.cos(tiltRad);
  const currentZ = startZ + elapsed * fallSpeed * Math.sin(tiltRad);
  
  // Check for impact: when the note reaches the cello surface
  const isImpact = currentY <= position.y && !hasImpacted;
  if (isImpact) {
    setHasImpacted(true);
    onImpact?.(note);
  }

  // Remove note if it's fallen too far
  if (currentY < position.y - 2) return null;

  // Make notes taller based on duration
  const noteHeight = Math.max(note.duration * 0.5, 0.1); // Scale height with duration

  return (
    <mesh position={[position.x, currentY, currentZ]}>
      <cylinderGeometry args={[0.03, 0.03, noteHeight, 8]} />
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
  const [fileMessage, setFileMessage] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const startRef = useRef<number | null>(null);
  const pauseOffset = useRef<number>(0);
  const rafId = useRef<number>();

  // Initialize sound on first user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      initSound();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
    
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

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

  // Export current mapping to file
  const handleExportMapping = () => {
    // This would need the current mapping data - for now just show message
    setFileMessage('⚠️ Export mapping from Debug Scene first');
    setTimeout(() => setFileMessage(''), 3000);
  };

  // Import mapping from file
  const handleImportMapping = async () => {
    try {
      const mapping = await importMappingFromFile();
      if (mapping) {
        setFileMessage('✅ Mapping imported successfully!');
        setTimeout(() => setFileMessage(''), 3000);
        // No page reload - just load into memory for testing
      }
    } catch (error) {
      setFileMessage('❌ Failed to import mapping');
      setTimeout(() => setFileMessage(''), 3000);
    }
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
    
    // Play sound on impact
    if (soundEnabled) {
      soundGenerator.playNote(note.string, note.bin, 0.3);
    }
  };

  // Check if mapping exists
  const mappingExists = hasMapping();
  const celloScale = getCelloScale();

  return (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={togglePlay} style={{ padding: '6px 16px', fontWeight: 600, fontSize: 15 }}>
          {isRunning ? 'Pause' : 'Play'}
        </button>
        <button onClick={resetAnimation} style={{ padding: '6px 16px', fontWeight: 600, fontSize: 15 }}>
          Reset
        </button>
        <button onClick={handleImportMapping} style={{ padding: '6px 16px', fontWeight: 600, fontSize: 15, backgroundColor: '#007bff', color: 'white' }}>
          Import JSON
        </button>
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)} 
          style={{ 
            padding: '6px 16px', 
            fontWeight: 600, 
            fontSize: 15, 
            backgroundColor: soundEnabled ? '#28a745' : '#6c757d', 
            color: 'white' 
          }}
        >
          {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
        </button>
        <span style={{ marginLeft: 12 }}>
          Time: {currentTime.toFixed(1)}s | Impacted: {impactedNotes.size}/{TEST_NOTES.length}
        </span>
        {!mappingExists && (
          <span style={{ color: 'orange', marginLeft: 12 }}>
            ⚠️ No mapping loaded. Import JSON file or export from Debug Scene.
          </span>
        )}
        {fileMessage && (
          <span style={{ color: fileMessage.includes('✅') ? 'green' : fileMessage.includes('⚠️') ? 'orange' : 'red', marginLeft: 12 }}>
            {fileMessage}
          </span>
        )}
      </div>
      
      <div style={{ marginBottom: 8, padding: '8px 12px', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '14px' }}>
        <strong>Storage:</strong> JSON files only (no browser storage)<br/>
        <strong>Export:</strong> Use Debug Scene to export cello-mapping.json<br/>
        <strong>Import:</strong> Load JSON file to test mapping<br/>
        <strong>Mapping Status:</strong> {mappingExists ? '✅ Loaded' : '❌ Not found'}<br/>
        <strong>Cello Scale:</strong> {celloScale}<br/>
        <strong>Test Notes:</strong> ALL {TEST_NOTES.length} points (C0-C9, G0-G9, D0-D9, A0-A9)<br/>
        <strong>Test Duration:</strong> ~{Math.max(...TEST_NOTES.map(n => n.startTime + n.duration)).toFixed(1)}s total<br/>
        <strong>Sound:</strong> Each note plays a semitone higher than the previous
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
        <h4>JSON-Only Storage Features:</h4>
        <ul>
          <li>Tests EVERY point on EVERY string (40 total points)</li>
          <li>Each note has one definitive 3D position on the cello</li>
          <li>Positions scale automatically with the cello model</li>
          <li>Mapping stored in JSON files only (no browser storage)</li>
          <li>Export from Debug Scene, import to test here</li>
          <li>Notes fall from above and impact at their exact positions</li>
          <li>Notes are cylinders with height based on duration</li>
          <li>Notes fall perpendicular to the cello tilt</li>
          <li>Sound plays on impact - each position is a semitone higher</li>
          <li>Test sequence: C0→C1→...→C9→G0→G1→...→G9→D0→...→A9</li>
        </ul>
      </div>
    </div>
  );
} 