import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import CelloModel from './CelloModel';
import FallingNote from './FallingNote';
import type { StringName, MusicalNote, StringOption, SheetMusicNote } from '../types';
import { 
  getStringOptionsForNote, 
  formatNoteName, 
  formatStringOption, 
  getDifficultyColor 
} from '../utils/fingerboardMapper';
import { getNotePosition, getCelloScale, hasMapping } from '../utils/celloMapping';
import { playNote } from '../utils/soundGenerator';
import React from 'react';

const STRING_COLORS: Record<StringName, string> = {
  C: '#FF4C4C',
  G: '#00FF77',
  D: '#FFD700',
  A: '#00AFFF',
};

// Sample sheet music for testing
const SAMPLE_SHEET_MUSIC: SheetMusicNote[] = [
  { id: '1', musicalNote: { note: 'C', octave: 3, frequency: 130.81 }, startTime: 0, duration: 1 },
  { id: '2', musicalNote: { note: 'D', octave: 3, frequency: 146.83 }, startTime: 1, duration: 1 },
  { id: '3', musicalNote: { note: 'E', octave: 3, frequency: 164.81 }, startTime: 2, duration: 1 },
  { id: '4', musicalNote: { note: 'F', octave: 3, frequency: 174.61 }, startTime: 3, duration: 1 },
  { id: '5', musicalNote: { note: 'G', octave: 3, frequency: 196.00 }, startTime: 4, duration: 1 },
  { id: '6', musicalNote: { note: 'A', octave: 3, frequency: 220.00 }, startTime: 5, duration: 1 },
  { id: '7', musicalNote: { note: 'B', octave: 3, frequency: 246.94 }, startTime: 6, duration: 1 },
  { id: '8', musicalNote: { note: 'C', octave: 4, frequency: 261.63 }, startTime: 7, duration: 1 },
];

interface NoteWithStringChoice extends SheetMusicNote {
  selectedString?: StringName;
  selectedPosition?: number;
  stringOptions: StringOption[];
}

export default function SheetMusicScene() {
  const [sheetMusic, setSheetMusic] = useState<NoteWithStringChoice[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedNote, setSelectedNote] = useState<NoteWithStringChoice | null>(null);
  const [showStringChoices, setShowStringChoices] = useState(false);

  const mappingExists = hasMapping();
  const celloScale = getCelloScale();
  const animationRef = useRef<number>();

  // Initialize sheet music with string options
  useEffect(() => {
    const notesWithOptions = SAMPLE_SHEET_MUSIC.map(note => ({
      ...note,
      stringOptions: getStringOptionsForNote(note.musicalNote)
    }));
    setSheetMusic(notesWithOptions);
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const animate = (timestamp: number) => {
      setCurrentTime(timestamp / 1000);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const reset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleNoteClick = (note: NoteWithStringChoice) => {
    setSelectedNote(note);
    setShowStringChoices(true);
  };

  const handleStringChoice = (note: NoteWithStringChoice, option: StringOption) => {
    const updatedSheetMusic = sheetMusic.map(n => 
      n.id === note.id 
        ? { ...n, selectedString: option.string, selectedPosition: option.position }
        : n
    );
    setSheetMusic(updatedSheetMusic);
    setSelectedNote(null);
    setShowStringChoices(false);
  };

  const getNotePosition = (note: NoteWithStringChoice) => {
    if (!note.selectedString || note.selectedPosition === undefined) return null;
    return getNotePosition({ string: note.selectedString, bin: note.selectedPosition });
  };

  const handleNoteImpact = (note: NoteWithStringChoice) => {
    if (soundEnabled) {
      playNote(note.musicalNote.frequency);
    }
  };

  const filteredNotes = sheetMusic.filter(note => {
    const elapsed = currentTime - note.startTime;
    return elapsed >= -2 && elapsed <= note.duration + 2;
  });

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button 
          onClick={togglePlay}
          style={{ 
            padding: '8px 16px', 
            fontWeight: 600, 
            fontSize: 15,
            backgroundColor: isPlaying ? '#dc3545' : '#28a745',
            color: 'white'
          }}
        >
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
        
        <button 
          onClick={reset}
          style={{ 
            padding: '8px 16px', 
            fontWeight: 600, 
            fontSize: 15,
            backgroundColor: '#6c757d',
            color: 'white'
          }}
        >
          🔄 Reset
        </button>

        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          style={{ 
            padding: '8px 16px', 
            fontWeight: 600, 
            fontSize: 15,
            backgroundColor: soundEnabled ? '#007bff' : '#6c757d',
            color: 'white'
          }}
        >
          {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
        </button>

        <span style={{ marginLeft: 'auto', fontSize: 16, fontWeight: 600 }}>
          Time: {currentTime.toFixed(1)}s
        </span>

        {!mappingExists && (
          <span style={{ color: 'orange', marginLeft: 12 }}>
            ⚠️ No cello mapping loaded. Import JSON file first.
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left side - 3D Visualization */}
        <div>
          <h3>Sheet Music Visualization</h3>
          <div style={{ width: '100%', height: 500 }}>
            <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} />
              
              <CelloModel position={[0, -1.5, 0]} scale={celloScale} />
              
              {/* Falling notes */}
              {filteredNotes.map((note) => {
                const position = getNotePosition(note);
                if (!position) return null;

                const elapsed = currentTime - note.startTime;
                const isActive = elapsed >= 0 && elapsed <= note.duration;

                return (
                  <FallingNote
                    key={note.id}
                    position={position}
                    startTime={note.startTime}
                    duration={note.duration}
                    currentTime={currentTime}
                    color={note.selectedString ? STRING_COLORS[note.selectedString] : '#ffffff'}
                    onImpact={() => handleNoteImpact(note)}
                    isActive={isActive}
                  />
                );
              })}
              
              <OrbitControls enableZoom enablePan enableRotate />
            </Canvas>
          </div>
        </div>

        {/* Right side - Sheet Music and Controls */}
        <div>
          <h3>Sheet Music & String Choices</h3>
          
          {/* Sheet Music List */}
          <div style={{ marginBottom: 16 }}>
            <h4>Notes:</h4>
            <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: 4 }}>
              {sheetMusic.map((note, index) => (
                <div
                  key={note.id}
                  onClick={() => handleNoteClick(note)}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #dee2e6',
                    cursor: 'pointer',
                    backgroundColor: selectedNote?.id === note.id ? '#e3f2fd' : 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong>{formatNoteName(note.musicalNote)}</strong>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      Time: {note.startTime}s - {note.startTime + note.duration}s
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {note.selectedString ? (
                      <span style={{ 
                        color: STRING_COLORS[note.selectedString], 
                        fontWeight: 'bold' 
                      }}>
                        {note.selectedString} {note.selectedPosition === 0 ? '(open)' : `pos ${note.selectedPosition}`}
                      </span>
                    ) : (
                      <span style={{ color: '#dc3545', fontSize: 12 }}>No string chosen</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* String Choice Modal */}
          {showStringChoices && selectedNote && (
            <div style={{ 
              padding: 16, 
              backgroundColor: '#f8f9fa', 
              borderRadius: 4, 
              border: '1px solid #dee2e6',
              marginBottom: 16
            }}>
              <h4>Choose String for {formatNoteName(selectedNote.musicalNote)}:</h4>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {selectedNote.stringOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleStringChoice(selectedNote, option)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      marginBottom: 4,
                      fontSize: 14,
                      backgroundColor: '#ffffff',
                      color: 'black',
                      border: `2px solid ${getDifficultyColor(option.difficulty)}`,
                      borderRadius: 4,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ color: getDifficultyColor(option.difficulty), fontWeight: 'bold' }}>
                      {option.difficulty.toUpperCase()}
                    </span>
                    {' - '}
                    {formatStringOption(option)}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowStringChoices(false)}
                style={{
                  marginTop: 8,
                  padding: '6px 12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Instructions */}
          <div style={{ padding: 12, backgroundColor: '#e9ecef', borderRadius: 4, fontSize: 14 }}>
            <h4>How to use:</h4>
            <ol>
              <li>Click on any note in the sheet music list</li>
              <li>Choose which string/position to play it on</li>
              <li>Press Play to see the notes fall and hear them</li>
              <li>Notes will play at their assigned string positions</li>
            </ol>
            <p><strong>Colors:</strong> Green = Easy, Yellow = Medium, Red = Hard</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <h4>Sheet Music Features:</h4>
        <ul>
          <li>Load and visualize sheet music in 3D</li>
          <li>Choose string options for each note</li>
          <li>Real-time falling note animation</li>
          <li>Sound playback on note impact</li>
          <li>Difficulty indicators for fingering choices</li>
          <li>Play/pause/reset controls</li>
        </ul>
      </div>
    </div>
  );
} 