// src/types.ts

export type StringName = 'C' | 'G' | 'D' | 'A';

export interface Note {
  id: string;
  string: StringName;
  bin: number;
  startTime: number; // seconds
  duration: number;  // seconds
}