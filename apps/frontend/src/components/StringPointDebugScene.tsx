import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import CelloModel from './CelloModel';
import type { StringName } from '../types';
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
    const exportData = points.map(({ string, index, x, y, z }) => ({ string, index, x, y, z }));
    await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <button onClick={handleExport} style={{ padding: '6px 16px', fontWeight: 600, fontSize: 15 }}>
          Export Points
        </button>
        {copied && <span style={{ color: 'green', marginLeft: 12 }}>Copied to clipboard!</span>}
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