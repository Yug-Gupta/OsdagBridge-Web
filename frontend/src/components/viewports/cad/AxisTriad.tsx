import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

interface AxisTriadProps {
  camera: THREE.Camera | null;
  size?: number;  // canvas size in px, default 84
  armLen?: number; // shaft length in px, default 28
}

/**
 * Desktop OCC uses Z-up convention:
 *   Z (blue)  → world Y in Three.js  (vertical up)
 *   X (red)   → world X in Three.js  (lateral / span direction)
 *   Y (green) → world Z in Three.js  (longitudinal depth)
 * This matches the axis labels visible in the desktop screenshots exactly.
 */
const COL_X = '#d91a1a'; // red   rgb(217, 26, 26)
const COL_Y = '#005900'; // green rgb(0, 89, 0)
const COL_Z = '#1a1ad9'; // blue  rgb(26, 26, 217)

interface ArrowData {
  label: string;
  col: string;
  tx: number;
  ty: number;
  depth: number;
}

export const AxisTriad: React.FC<AxisTriadProps> = ({
  camera,
  size = 84,
  armLen = 28,
}) => {
  const [arrows, setArrows] = useState<ArrowData[]>([]);
  const animFrameRef = useRef<number>(0);

  const cx = size / 2;
  const cy = size / 2;
  const L = armLen;
  const headBase = 6;

  const sync = useCallback(() => {
    if (!camera) return;

    // Extract camera world matrix axes
    // camera.matrixWorld columns:
    //   col 0 = camera right vector (world space)
    //   col 1 = camera up vector (world space)
    //   col 2 = camera backward vector (world space)  i.e. -forward
    const m = camera.matrixWorld.elements;
    const right   = new THREE.Vector3(m[0], m[1], m[2]).normalize();
    const up      = new THREE.Vector3(m[4], m[5], m[6]).normalize();
    const forward = new THREE.Vector3(-m[8], -m[9], -m[10]).normalize();

    /**
     * OCC → Three.js axis remapping (to match desktop triad labels):
     *  OCC Z (label "Z", blue)  = Three.js world Y  → direction (0,1,0)
     *  OCC X (label "X", red)   = Three.js world X  → direction (1,0,0)
     *  OCC Y (label "Y", green) = Three.js world Z  → direction (0,0,1)
     *
     * The depth (sz) is used for painter's-algorithm back-to-front sorting.
     */
    const worldAxes = [
      { label: 'Z', col: COL_Z, dir: new THREE.Vector3(0, 1, 0) },  // OCC Z = Three.js +Y
      { label: 'X', col: COL_X, dir: new THREE.Vector3(1, 0, 0) },  // OCC X = Three.js +X
      { label: 'Y', col: COL_Y, dir: new THREE.Vector3(0, 0, 1) },  // OCC Y = Three.js +Z
    ];

    const projected: ArrowData[] = worldAxes.map(({ label, col, dir }) => {
      const sx = dir.dot(right);
      const sy = dir.dot(up);
      const sz = dir.dot(forward);

      const tx = cx + sx * L;
      const ty = cy - sy * L; // SVG Y is downward

      return { label, col, tx, ty, depth: sz };
    });

    // Sort back-to-front (painter's algorithm)
    projected.sort((a, b) => a.depth - b.depth);
    setArrows(projected);
  }, [camera, cx, cy, L]);

  useEffect(() => {
    const loop = () => {
      sync();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [sync]);

  return (
    <div
      className="osdag-axis-triad"
      style={{
        position: 'absolute',
        bottom: '14px',
        right: '14px',
        width: `${size}px`,
        height: `${size}px`,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 20,
      }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Origin dot */}
        <circle cx={cx} cy={cy} r={3} fill="#555555" />

        {arrows.map(({ label, col, tx, ty }) => {
          const dx = tx - cx;
          const dy = ty - cy;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;

          // Perpendicular unit vector for arrowhead wings
          const px = -dy / len;
          const py = dx / len;

          // Arrowhead base position (slightly back from tip)
          const bx = tx - (dx / len) * headBase * 1.6;
          const by = ty - (dy / len) * headBase * 1.6;

          const p1x = tx;
          const p1y = ty;
          const p2x = bx + px * headBase * 0.65;
          const p2y = by + py * headBase * 0.65;
          const p3x = bx - px * headBase * 0.65;
          const p3y = by - py * headBase * 0.65;

          // Label position slightly beyond tip
          const lx = tx + (dx / len) * 10;
          const ly = ty + (dy / len) * 10;

          return (
            <g key={label}>
              {/* Shaft */}
              <line
                x1={cx}
                y1={cy}
                x2={tx}
                y2={ty}
                stroke={col}
                strokeWidth={2.2}
                strokeLinecap="round"
              />
              {/* Arrowhead */}
              <polygon
                points={`${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y}`}
                fill={col}
              />
              {/* Axis Label */}
              <text
                x={lx}
                y={ly + 4}
                fill={col}
                fontSize={10}
                fontWeight="bold"
                fontFamily="Arial, sans-serif"
                textAnchor="middle"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
