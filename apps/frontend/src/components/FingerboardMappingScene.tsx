import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import CelloModel from './CelloModel';
import type { StringName, MusicalNote, StringOption, FingerboardNote } from '../types';
import { 
  generateFingerboardMapping, 
  getStringOptionsForNote, 
  formatNoteName, 
  formatStringOption, 
  getDifficultyColor 
} from '../utils/fingerboardMapper';
import { getNotePosition, getStringPositions, getCelloScale, hasMapping } from '../utils/celloMapping';
import React from 'react';

const STRING_COLORS: Record<StringName, string> = {
  C: '#FF4C4C',
  G: '#00FF77',
  D: '#FFD700',
  A: '#00AFFF',
};

const STRINGS: StringName[] = ['C', 'G', 'D', 'A'];

// Sample musical notes for testing
const SAMPLE_NOTES: MusicalNote[] = [
  { note: 'C', octave: 2, frequency: 65.41 },
  { note: 'D', octave: 2, frequency: 73.42 },
  { note: 'E', octave: 2, frequency: 82.41 },
  { note: 'F', octave: 2, frequency: 87.31 },
  { note: 'G', octave: 2, frequency: 98.00 },
  { note: 'A', octave: 2, frequency: 110.00 },
  { note: 'B', octave: 2, frequency: 123.47 },
  { note: 'C', octave: 3, frequency: 130.81 },
  { note: 'D', octave: 3, frequency: 146.83 },
  { note: 'E', octave: 3, frequency: 164.81 },
  { note: 'F', octave: 3, frequency: 174.61 },
  { note: 'G', octave: 3, frequency: 196.00 },
  { note: 'A', octave: 3, frequency: 220.00 },
  { note: 'B', octave: 3, frequency: 246.94 },
  { note: 'C', octave: 4, frequency: 261.63 },
];

interface FingerboardNoteVisualProps {
  string: StringName;
  position: number;
  musicalNote: MusicalNote;
  isOpenString: boolean;
  isSelected: boolean;
  onClick: () => void;
}

function FingerboardNoteVisual({ 
  string, 
  position, 
  musicalNote, 
  isOpenString, 
  isSelected, 
  onClick 
}: FingerboardNoteVisualProps) {
  // Get 3D position from cello mapping
  const celloPosition = getNotePosition({ string, bin: position });
  if (!celloPosition) return null;

  const noteName = formatNoteName(musicalNote);
  const isOpen = isOpenString;

  return (
    <mesh position={[celloPosition.x, celloPosition.y, celloPosition.z]} onClick={onClick}>
      <sphereGeometry args={[isOpen ? 0.04 : 0.03, 16, 16]} />
      <meshStandardMaterial 
        color={isSelected ? '#ffffff' : STRING_COLORS[string]}
        emissive={isSelected ? '#ffffff' : '#000000'}
        emissiveIntensity={isSelected ? 0.3 : 0}
      />
    </mesh>
  );
}

export default function FingerboardMappingScene() {
  const [fingerboardMapping, setFingerboardMapping] = useState(generateFingerboardMapping());
  const [selectedNote, setSelectedNote] = useState<FingerboardNote | null>(null);
  const [selectedMusicalNote, setSelectedMusicalNote] = useState<MusicalNote | null>(null);
  const [stringOptions, setStringOptions] = useState<StringOption[]>([]);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [filterString, setFilterString] = useState<StringName | 'all'>('all');

  const mappingExists = hasMapping();
  const celloScale = getCelloScale();

  // Update string options when musical note changes
  useEffect(() => {
    if (selectedMusicalNote) {
      const options = getStringOptionsForNote(selectedMusicalNote);
      setStringOptions(options);
    } else {
      setStringOptions([]);
    }
  }, [selectedMusicalNote]);

  const handleNoteClick = (fingerboardNote: FingerboardNote) => {
    setSelectedNote(fingerboardNote);
    setSelectedMusicalNote(fingerboardNote.musicalNote);
  };

  const handleStringOptionSelect = (option: StringOption) => {
    if (selectedMusicalNote) {
      // Update the fingerboard mapping with the selected option
      const updatedMapping = {
        ...fingerboardMapping,
        notes: fingerboardMapping.notes.map(note => {
          if (note.string === option.string && note.position === option.position) {
            return {
              ...note,
              musicalNote: selectedMusicalNote
            };
          }
          return note;
        })
      };
      setFingerboardMapping(updatedMapping);
      setSelectedNote(null);
      setSelectedMusicalNote(null);
    }
  };

  const filteredNotes = fingerboardMapping.notes.filter(note => {
    if (filterString !== 'all' && note.string !== filterString) return false;
    if (!showAllNotes && !note.isOpenString) return false;
    return true;
  });

  return (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setShowAllNotes(!showAllNotes)}
          style={{ 
            padding: '6px 16px', 
            fontWeight: 600, 
            fontSize: 15,
            backgroundColor: showAllNotes ? '#007bff' : '#6c757d',
            color: 'white'
          }}
        >
          {showAllNotes ? 'Show Open Strings Only' : 'Show All Positions'}
        </button>
        
        <select 
          value={filterString} 
          onChange={(e) => setFilterString(e.target.value as StringName | 'all')}
          style={{ padding: '6px 12px', fontSize: 15 }}
        >
          <option value="all">All Strings</option>
          {STRINGS.map(string => (
            <option key={string} value={string}>{string} String</option>
          ))}
        </select>

        {!mappingExists && (
          <span style={{ color: 'orange', marginLeft: 12 }}>
            ⚠️ No cello mapping loaded. Import JSON file first.
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
        {/* Left side - 3D Visualization */}
        <div>
          <h3>Fingerboard Visualization</h3>
          <div style={{ width: '100%', height: 400 }}>
            <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} />
              
              <CelloModel position={[0, -1.5, 0]} scale={celloScale} />
              
              {/* String position markers */}
              {STRINGS.map(string => {
                const positions = getStringPositions(string);
                return positions.map((pos, index) => (
                  <mesh key={`${string}-${index}`} position={[pos.x, pos.y, pos.z]}>
                    <sphereGeometry args={[0.02, 8, 8]} />
                    <meshStandardMaterial color={STRING_COLORS[string]} opacity={0.3} transparent />
                  </mesh>
                ));
              })}
              
              {/* Fingerboard notes */}
              {filteredNotes.map((note, index) => (
                <FingerboardNoteVisual
                  key={`${note.string}-${note.position}`}
                  string={note.string}
                  position={note.position}
                  musicalNote={note.musicalNote}
                  isOpenString={note.isOpenString}
                  isSelected={selectedNote === note}
                  onClick={() => handleNoteClick(note)}
                />
              ))}
              
              <OrbitControls enableZoom enablePan enableRotate />
            </Canvas>
          </div>
        </div>

        {/* Right side - Controls */}
        <div>
          <h3>Note Assignment</h3>
          
          {/* Selected Note Info */}
          {selectedNote && (
            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
              <h4>Selected Position:</h4>
              <p><strong>String:</strong> {selectedNote.string}</p>
              <p><strong>Position:</strong> {selectedNote.isOpenString ? 'Open String' : `Position ${selectedNote.position}`}</p>
              <p><strong>Current Note:</strong> {formatNoteName(selectedNote.musicalNote)}</p>
            </div>
          )}

          {/* Musical Note Selection */}
          <div style={{ marginBottom: 16 }}>
            <h4>Select Musical Note:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
              {SAMPLE_NOTES.map((note) => (
                <button
                  key={formatNoteName(note)}
                  onClick={() => setSelectedMusicalNote(note)}
                  style={{
                    padding: '8px 12px',
                    fontSize: 14,
                    backgroundColor: selectedMusicalNote === note ? '#007bff' : '#f8f9fa',
                    color: selectedMusicalNote === note ? 'white' : 'black',
                    border: '1px solid #dee2e6',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  {formatNoteName(note)}
                </button>
              ))}
            </div>
          </div>

          {/* String Options */}
          {selectedMusicalNote && stringOptions.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4>String Options for {formatNoteName(selectedMusicalNote)}:</h4>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {stringOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleStringOptionSelect(option)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      marginBottom: 4,
                      fontSize: 14,
                      backgroundColor: '#f8f9fa',
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
            </div>
          )}

          {/* Instructions */}
          <div style={{ padding: 12, backgroundColor: '#e9ecef', borderRadius: 4, fontSize: 14 }}>
            <h4>How to use:</h4>
            <ol>
              <li>Click on a fingerboard position in the 3D view</li>
              <li>Select a musical note from the grid</li>
              <li>Choose which string/position to assign it to</li>
              <li>The mapping will be updated automatically</li>
            </ol>
            <p><strong>Colors:</strong> Green = Easy, Yellow = Medium, Red = Hard</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <h4>Fingerboard Mapping Features:</h4>
        <ul>
          <li>Visualize all fingerboard positions in 3D</li>
          <li>Assign musical notes to specific string positions</li>
          <li>See multiple string options for each note</li>
          <li>Difficulty indicators for fingering choices</li>
          <li>Filter by string or show open strings only</li>
          <li>Real-time mapping updates</li>
        </ul>
      </div>
    </div>
  );
} 