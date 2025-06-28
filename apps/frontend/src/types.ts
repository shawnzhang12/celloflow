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