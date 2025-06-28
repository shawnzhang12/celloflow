import type { StringName, StringPoint, CelloMapping, Note } from '../types';

// Global variable to store the current mapping in memory
let currentMapping: CelloMapping | null = null;

// Load mapping from memory (set by file import)
export function loadMapping(): CelloMapping | null {
  return currentMapping;
}

// Save mapping to memory (called by file import)
export function saveMapping(mapping: CelloMapping) {
  currentMapping = mapping;
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

  // The points from export already have tilt applied, so return them directly
  return {
    x: point.x,
    y: point.y,
    z: point.z
  };
}

// Get all available positions for a string
export function getStringPositions(string: StringName): { x: number; y: number; z: number }[] {
  const mapping = loadMapping();
  if (!mapping || !mapping.points) return [];

  const stringPoints = mapping.points.filter(p => p.string === string);
  
  // The points from export already have tilt applied, so return them directly
  return stringPoints.map(point => ({
    x: point.x,
    y: point.y,
    z: point.z
  }));
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
  currentMapping = null;
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

// Export mapping to JSON file
export function exportMappingToFile(mapping: CelloMapping) {
  const dataStr = JSON.stringify(mapping, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = 'cello-mapping.json';
  link.click();
  
  URL.revokeObjectURL(link.href);
}

// Import mapping from JSON file
export function importMappingFromFile(): Promise<CelloMapping | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const mapping = JSON.parse(e.target?.result as string);
          if (validateMapping(mapping)) {
            saveMapping(mapping);
            resolve(mapping);
          } else {
            alert('Invalid mapping file format!');
            resolve(null);
          }
        } catch (error) {
          alert('Error reading file: ' + error);
          resolve(null);
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  });
} 