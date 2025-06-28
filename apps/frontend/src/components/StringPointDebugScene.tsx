import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import CelloModel from './CelloModel';
import type { StringName, StringPoint, CelloMapping } from '../types';
import { loadMapping, saveMapping, validateMapping } from '../utils/celloMapping';
import React from 'react';

const STRINGS: StringName[] = ['C', 'G', 'D', 'A'];
const STRING_COLORS: Record<StringName, string> = {
  C: '#FF4C4C',
  G: '#00FF77',
  D: '#FFD700',
  A: '#00AFFF',
};
const POINTS_PER_STRING = 10;

const STORAGE_KEY = 'stringPointDebugParams';

function loadParams() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveParams(params: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
}

function rotateYandZ(y: number, z: number, angleRad: number) {
  // Rotate around X axis
  return {
    y: y * Math.cos(angleRad) - z * Math.sin(angleRad),
    z: y * Math.sin(angleRad) + z * Math.cos(angleRad),
  };
}

// Utility function to get permanent 3D position for any note
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

// Utility function to get all available positions for a string
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

export default function StringPointDebugScene() {
  // Load from localStorage or use defaults
  const loaded = loadParams();
  const [celloScale, setCelloScale] = useState(loaded?.celloScale ?? 5);
  const [pointSize, setPointSize] = useState(loaded?.pointSize ?? 0.025);
  const [centerX, setCenterX] = useState(loaded?.centerX ?? 0);
  const [centerY, setCenterY] = useState(loaded?.centerY ?? 0);
  const [centerZ, setCenterZ] = useState(loaded?.centerZ ?? -0.5);
  const [hSpacing, setHSpacing] = useState(loaded?.hSpacing ?? 0.3); // horizontal (between strings)
  const [vSpacing, setVSpacing] = useState(loaded?.vSpacing ?? 0.33); // vertical (between points)
  const [tiltDeg, setTiltDeg] = useState(loaded?.tiltDeg ?? 0); // degrees
  const [copied, setCopied] = useState(false);
  const [loadMessage, setLoadMessage] = useState('');

  // Save to localStorage on any param change
  useEffect(() => {
    saveParams({ celloScale, pointSize, centerX, centerY, centerZ, hSpacing, vSpacing, tiltDeg });
  }, [celloScale, pointSize, centerX, centerY, centerZ, hSpacing, vSpacing, tiltDeg]);

  const tiltRad = (tiltDeg * Math.PI) / 180;

  // Generate points grid
  const points = STRINGS.flatMap((string, sIdx) => {
    return Array.from({ length: POINTS_PER_STRING }, (_, i) => {
      // Center the grid
      const x = centerX + (sIdx - (STRINGS.length - 1) / 2) * hSpacing;
      const y = centerY + (i - (POINTS_PER_STRING - 1) / 2) * vSpacing;
      const { y: yT, z: zT } = rotateYandZ(y, centerZ, tiltRad);
      return {
        string,
        index: i,
        x,
        y: yT,
        z: zT,
      };
    });
  });

  const handleExport = async () => {
    const mapping: CelloMapping = {
      points: points.map(({ string, index, x, y, z }) => ({ string, index, x, y, z })),
      celloScale,
      centerX,
      centerY,
      centerZ,
      hSpacing,
      vSpacing,
      tiltDeg,
      version: '1.0'
    };
    
    await navigator.clipboard.writeText(JSON.stringify(mapping, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoad = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const mapping: CelloMapping = JSON.parse(clipboardText);
      
      // Validate the mapping data
      if (!validateMapping(mapping)) {
        setLoadMessage('Invalid mapping data: missing required fields');
        setTimeout(() => setLoadMessage(''), 3000);
        return;
      }

      // Apply the loaded mapping parameters
      setCelloScale(mapping.celloScale ?? celloScale);
      setCenterX(mapping.centerX ?? centerX);
      setCenterY(mapping.centerY ?? centerY);
      setCenterZ(mapping.centerZ ?? centerZ);
      setHSpacing(mapping.hSpacing ?? hSpacing);
      setVSpacing(mapping.vSpacing ?? vSpacing);
      setTiltDeg(mapping.tiltDeg ?? tiltDeg);

      // Save the mapping for permanent use
      saveMapping(mapping);
      
      setLoadMessage('Mapping loaded and saved successfully!');
      setTimeout(() => setLoadMessage(''), 3000);
    } catch (error) {
      setLoadMessage('Failed to load mapping: ' + (error as Error).message);
      setTimeout(() => setLoadMessage(''), 3000);
    }
  };

  const handleLoadFromStorage = () => {
    const storedMapping = loadMapping();
    if (storedMapping) {
      setCelloScale(storedMapping.celloScale ?? celloScale);
      setCenterX(storedMapping.centerX ?? centerX);
      setCenterY(storedMapping.centerY ?? centerY);
      setCenterZ(storedMapping.centerZ ?? centerZ);
      setHSpacing(storedMapping.hSpacing ?? hSpacing);
      setVSpacing(storedMapping.vSpacing ?? vSpacing);
      setTiltDeg(storedMapping.tiltDeg ?? tiltDeg);
      
      setLoadMessage('Mapping loaded from storage!');
      setTimeout(() => setLoadMessage(''), 3000);
    } else {
      setLoadMessage('No mapping found in storage');
      setTimeout(() => setLoadMessage(''), 3000);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={handleExport} style={{ padding: '6px 16px', fontWeight: 600, fontSize: 15 }}>
          Export Mapping
        </button>
        <button onClick={handleLoad} style={{ padding: '6px 16px', fontWeight: 600, fontSize: 15 }}>
          Load from Clipboard
        </button>
        <button onClick={handleLoadFromStorage} style={{ padding: '6px 16px', fontWeight: 600, fontSize: 15 }}>
          Load from Storage
        </button>
        {copied && <span style={{ color: 'green', marginLeft: 12 }}>Copied to clipboard!</span>}
        {loadMessage && <span style={{ color: loadMessage.includes('Failed') ? 'red' : 'green', marginLeft: 12 }}>{loadMessage}</span>}
      </div>
      <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'center' }}>
        <label>
          <b>Cello Scale:</b> {celloScale.toFixed(2)}
          <input
            type="range"
            min={1}
            max={20}
            step={0.01}
            value={celloScale}
            onChange={e => setCelloScale(Number(e.target.value))}
            style={{ width: 140, marginLeft: 8 }}
          />
        </label>
        <label>
          <b>Point Size:</b> {pointSize.toFixed(3)}
          <input
            type="range"
            min={0.005}
            max={0.1}
            step={0.001}
            value={pointSize}
            onChange={e => setPointSize(Number(e.target.value))}
            style={{ width: 120, marginLeft: 8 }}
          />
        </label>
        <label>
          <b>Center X:</b> {centerX.toFixed(2)}
          <input
            type="range"
            min={-10}
            max={10}
            step={0.01}
            value={centerX}
            onChange={e => setCenterX(Number(e.target.value))}
            style={{ width: 120, marginLeft: 8 }}
          />
        </label>
        <label>
          <b>Center Y:</b> {centerY.toFixed(2)}
          <input
            type="range"
            min={-10}
            max={10}
            step={0.01}
            value={centerY}
            onChange={e => setCenterY(Number(e.target.value))}
            style={{ width: 120, marginLeft: 8 }}
          />
        </label>
        <label>
          <b>Center Z:</b> {centerZ.toFixed(2)}
          <input
            type="range"
            min={-10}
            max={10}
            step={0.01}
            value={centerZ}
            onChange={e => setCenterZ(Number(e.target.value))}
            style={{ width: 120, marginLeft: 8 }}
          />
        </label>
        <label>
          <b>Horizontal Spacing:</b> {hSpacing.toFixed(2)}
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.01}
            value={hSpacing}
            onChange={e => setHSpacing(Number(e.target.value))}
            style={{ width: 120, marginLeft: 8 }}
          />
        </label>
        <label>
          <b>Vertical Spacing:</b> {vSpacing.toFixed(2)}
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.01}
            value={vSpacing}
            onChange={e => setVSpacing(Number(e.target.value))}
            style={{ width: 120, marginLeft: 8 }}
          />
        </label>
        <label>
          <b>Tilt (deg):</b> {tiltDeg}
          <input
            type="range"
            min={-45}
            max={45}
            step={1}
            value={tiltDeg}
            onChange={e => setTiltDeg(Number(e.target.value))}
            style={{ width: 120, marginLeft: 8 }}
          />
        </label>
      </div>
      <div style={{ width: '100%', height: 500 }}>
        <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} />
          <CelloModel position={[0, -1.5, 0]} scale={celloScale} />
          {points.map((pt, i) => (
            <mesh key={pt.string + '-' + pt.index} position={[pt.x, pt.y, pt.z]}>
              <sphereGeometry args={[pointSize, 16, 16]} />
              <meshStandardMaterial color={STRING_COLORS[pt.string]} />
            </mesh>
          ))}
          <OrbitControls enableZoom enablePan enableRotate />
        </Canvas>
      </div>
    </div>
  );
} 