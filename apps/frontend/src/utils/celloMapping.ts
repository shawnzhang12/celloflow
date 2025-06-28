import type { StringName, StringPoint, CelloMapping, Note } from '../types';

const MAPPING_STORAGE_KEY = 'celloMappingData';

// Load mapping from localStorage
export function loadMapping(): CelloMapping | null {
  try {
    const raw = localStorage.getItem(MAPPING_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Save mapping to localStorage
export function saveMapping(mapping: CelloMapping) {
  localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(mapping));
}

// Rotate coordinates around X axis
function rotateYandZ(y: number, z: number, angleRad: number) {
  return {
    y: y * Math.cos(angleRad) - z * Math.sin(angleRad),
    z: y * Math.sin(angleRad) + z * Math.cos(angleRad),
  };
}

// Get the permanent 3D position for any note
export function getNotePosition(note: { string: StringName; bin: number }): { x: number; y: number; z: number } | null {
  const mapping = loadMapping();
  if (!mapping || !mapping.points) return null;

  // Find the point that matches the note's string and bin
  const point = mapping.points.find(p => p.string === note.string && p.index === note.bin);
  if (!point) return null;

  // Apply the stored transformation parameters to get the final position
  const tiltRad = (mapping.tiltDeg * Math.PI) / 180;
  const { y: yT, z: zT } = rotateYandZ(point.y, point.z, tiltRad);
  
  return {
    x: point.x,
    y: yT,
    z: zT
  };
}

// Get all available positions for a string
export function getStringPositions(string: StringName): { x: number; y: number; z: number }[] {
  const mapping = loadMapping();
  if (!mapping || !mapping.points) return [];

  const stringPoints = mapping.points.filter(p => p.string === string);
  const tiltRad = (mapping.tiltDeg * Math.PI) / 180;
  
  return stringPoints.map(point => {
    const { y: yT, z: zT } = rotateYandZ(point.y, point.z, tiltRad);
    return { x: point.x, y: yT, z: zT };
  });
}

// Get the cello scale from stored mapping
export function getCelloScale(): number {
  const mapping = loadMapping();
  return mapping?.celloScale ?? 5;
}

// Check if a mapping exists
export function hasMapping(): boolean {
  return loadMapping() !== null;
}

// Clear the stored mapping
export function clearMapping() {
  localStorage.removeItem(MAPPING_STORAGE_KEY);
}

// Validate a mapping object
export function validateMapping(mapping: any): mapping is CelloMapping {
  return (
    mapping &&
    Array.isArray(mapping.points) &&
    mapping.points.length > 0 &&
    typeof mapping.celloScale === 'number' &&
    typeof mapping.centerX === 'number' &&
    typeof mapping.centerY === 'number' &&
    typeof mapping.centerZ === 'number' &&
    typeof mapping.hSpacing === 'number' &&
    typeof mapping.vSpacing === 'number' &&
    typeof mapping.tiltDeg === 'number'
  );
} 