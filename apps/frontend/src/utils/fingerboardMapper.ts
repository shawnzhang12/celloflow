import type { StringName, MusicalNote, FingerboardNote, FingerboardMapping, StringOption } from '../types';

// Standard cello tuning frequencies
const CELLO_TUNING: Record<StringName, number> = {
  'C': 65.41,  // C2
  'G': 98.00,  // G2
  'D': 146.83, // D3
  'A': 220.00, // A3
};

// Note names in order
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Generate all possible fingerboard notes
export function generateFingerboardMapping(): FingerboardMapping {
  const notes: FingerboardNote[] = [];
  
  // For each string
  Object.entries(CELLO_TUNING).forEach(([stringName, baseFreq]) => {
    const string = stringName as StringName;
    
    // Add open string note
    const openNote = getNoteFromFrequency(baseFreq);
    notes.push({
      string,
      position: 0,
      musicalNote: openNote,
      isOpenString: true
    });
    
    // Add fingered positions (up to 12 positions = 1 octave)
    for (let position = 1; position <= 12; position++) {
      const freq = baseFreq * Math.pow(2, position / 12);
      const note = getNoteFromFrequency(freq);
      notes.push({
        string,
        position,
        musicalNote: note,
        isOpenString: false
      });
    }
  });
  
  return {
    notes,
    version: '1.0'
  };
}

// Get musical note from frequency
function getNoteFromFrequency(frequency: number): MusicalNote {
  // A4 = 440 Hz, calculate relative to that
  const a4Freq = 440;
  const a4NoteIndex = 9; // A is at index 9 in NOTE_NAMES
  const a4Octave = 4;
  
  // Calculate semitones from A4
  const semitones = Math.round(12 * Math.log2(frequency / a4Freq));
  
  // Calculate note and octave
  const totalSemitones = a4NoteIndex + semitones;
  const octave = a4Octave + Math.floor(totalSemitones / 12);
  const noteIndex = ((totalSemitones % 12) + 12) % 12;
  
  return {
    note: NOTE_NAMES[noteIndex],
    octave,
    frequency
  };
}

// Get all possible string options for a given musical note
export function getStringOptionsForNote(musicalNote: MusicalNote): StringOption[] {
  const options: StringOption[] = [];
  
  // Find all fingerboard notes that match this musical note
  const fingerboardMapping = generateFingerboardMapping();
  
  fingerboardMapping.notes.forEach(fingerboardNote => {
    if (fingerboardNote.musicalNote.note === musicalNote.note && 
        fingerboardNote.musicalNote.octave === musicalNote.octave) {
      
      // Determine difficulty based on position
      let difficulty: 'easy' | 'medium' | 'hard';
      if (fingerboardNote.isOpenString) {
        difficulty = 'easy';
      } else if (fingerboardNote.position <= 4) {
        difficulty = 'medium';
      } else {
        difficulty = 'hard';
      }
      
      options.push({
        string: fingerboardNote.string,
        position: fingerboardNote.position,
        isOpenString: fingerboardNote.isOpenString,
        difficulty
      });
    }
  });
  
  // Sort by difficulty (easy first)
  const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
  return options.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
}

// Get the 3D position for a string/position combination
export function getFingerboardPosition(string: StringName, position: number): { x: number; y: number; z: number } | null {
  // This would use the existing cello mapping to get the 3D position
  // For now, return null - this will be implemented when we connect to the cello mapping
  return null;
}

// Format note name for display
export function formatNoteName(musicalNote: MusicalNote): string {
  return `${musicalNote.note}${musicalNote.octave}`;
}

// Format string option for display
export function formatStringOption(option: StringOption): string {
  if (option.isOpenString) {
    return `${option.string} (open)`;
  } else {
    return `${option.string} position ${option.position}`;
  }
}

// Get difficulty color
export function getDifficultyColor(difficulty: 'easy' | 'medium' | 'hard'): string {
  switch (difficulty) {
    case 'easy': return '#28a745';
    case 'medium': return '#ffc107';
    case 'hard': return '#dc3545';
    default: return '#6c757d';
  }
} 