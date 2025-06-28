// src/types.ts

export type StringName = 'C' | 'G' | 'D' | 'A';

export interface Note {
  id: string;
  string: StringName;
  bin: number;
  startTime: number; // seconds
  duration: number;  // seconds
}

export interface StringPoint {
  string: StringName;
  index: number;
  x: number;
  y: number;
  z: number;
}

export interface CelloMapping {
  points: StringPoint[];
  celloScale: number;
  centerX: number;
  centerY: number;
  centerZ: number;
  hSpacing: number;
  vSpacing: number;
  tiltDeg: number;
  version: string;
}

// New types for fingerboard mapping
export interface MusicalNote {
  note: string; // e.g., "C", "C#", "D", "D#", etc.
  octave: number; // e.g., 2, 3, 4, etc.
  frequency: number; // Hz
}

export interface FingerboardNote {
  string: StringName;
  position: number; // 0 = open string, 1+ = fingered positions
  musicalNote: MusicalNote;
  isOpenString: boolean;
}

export interface FingerboardMapping {
  notes: FingerboardNote[];
  version: string;
}

export interface SheetMusicNote {
  id: string;
  musicalNote: MusicalNote;
  startTime: number;
  duration: number;
  suggestedString?: StringName; // Optional suggestion
  suggestedPosition?: number; // Optional suggestion
}

export interface StringOption {
  string: StringName;
  position: number;
  isOpenString: boolean;
  difficulty: 'easy' | 'medium' | 'hard'; // For fingering suggestions
}