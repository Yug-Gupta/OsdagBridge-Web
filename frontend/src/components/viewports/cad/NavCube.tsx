import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

interface NavCubeProps {
  camera: THREE.Camera | null;
  controls: any | null;
  onViewChange?: (view: string) => void;
  darkMode?: boolean;
}

type FaceType = 'TOP' | 'BOTTOM' | 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT';

interface FaceConfig {
  id: FaceType;
  label: string;
  transform: string;
  normal: [number, number, number];
  up: [number, number, number];
}

const CUBE_SIZE = 54; // px
const HALF_SIZE = CUBE_SIZE / 2;

const FACES: FaceConfig[] = [
  { id: 'TOP', label: 'TOP', transform: `rotateX(90deg) translateZ(${HALF_SIZE}px)`, normal: [0, 1, 0], up: [0, 0, -1] },
  { id: 'BOTTOM', label: 'BOTTOM', transform: `rotateX(-90deg) translateZ(${HALF_SIZE}px)`, normal: [0, -1, 0], up: [0, 0, 1] },
  { id: 'FRONT', label: 'FRONT', transform: `rotateY(0deg) translateZ(${HALF_SIZE}px)`, normal: [0, 0, 1], up: [0, 1, 0] },
  { id: 'BACK', label: 'BACK', transform: `rotateY(180deg) translateZ(${HALF_SIZE}px)`, normal: [0, 0, -1], up: [0, 1, 0] },
  { id: 'LEFT', label: 'LEFT', transform: `rotateY(-90deg) translateZ(${HALF_SIZE}px)`, normal: [-1, 0, 0], up: [0, 1, 0] },
  { id: 'RIGHT', label: 'RIGHT', transform: `rotateY(90deg) translateZ(${HALF_SIZE}px)`, normal: [1, 0, 0], up: [0, 1, 0] },
];

export const NavCube: React.FC<NavCubeProps> = ({
  camera,
  controls,
  onViewChange,
  darkMode = false,
}) => {
  const [matrixStyle, setMatrixStyle] = useState<string>('');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const animFrameRef = useRef<number>(0);
  const isTransitioningRef = useRef<boolean>(false);

  // Sync orientation with main 3D camera
  const syncOrientation = useCallback(() => {
    if (!camera) return;

    // We want the cube to reflect the camera's orientation.
    // In Three.js: camera looks along -Z in camera space.
    // Inverse of camera's view matrix gives the camera rotation.
    const m = new THREE.Matrix4().copy(camera.matrixWorldInverse);
    m.setPosition(0, 0, 0);

    // Deconstruct rotation
    const e = m.elements;
    // CSS matrix3d(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33)
    // Note that CSS Y is downward, Three.js Y is upward.
    const cssMatrix = [
      e[0], -e[1], -e[2], 0,
      -e[4], e[5], e[6], 0,
      e[8], -e[9], -e[10], 0,
      0, 0, 0, 1,
    ];

    setMatrixStyle(`matrix3d(${cssMatrix.map((v) => v.toFixed(5)).join(',')})`);
  }, [camera]);

  useEffect(() => {
    const loop = () => {
      syncOrientation();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [syncOrientation]);

  // Smooth camera transition to target orientation
  const animateCameraTo = (
    targetPos: THREE.Vector3,
    targetLookAt: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
    targetUp: THREE.Vector3 = new THREE.Vector3(0, 1, 0),
    duration = 350
  ) => {
    if (!camera || isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    const startPos = camera.position.clone();
    const startUp = camera.up.clone();
    const lookAtStart = controls?.target ? controls.target.clone() : new THREE.Vector3(0, 0, 0);

    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const t = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(startPos, targetPos, t);
      camera.up.lerpVectors(startUp, targetUp, t).normalize();

      const curLookAt = new THREE.Vector3().lerpVectors(lookAtStart, targetLookAt, t);
      camera.lookAt(curLookAt);

      if (controls) {
        controls.target.copy(curLookAt);
        controls.update();
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        isTransitioningRef.current = false;
        camera.position.copy(targetPos);
        camera.up.copy(targetUp).normalize();
        camera.lookAt(targetLookAt);
        if (controls) {
          controls.target.copy(targetLookAt);
          controls.update();
        }
      }
    };

    requestAnimationFrame(step);
  };

  // Face clicks
  const handleFaceClick = (face: FaceConfig) => {
    if (!camera) return;
    const currentDist = camera.position.length() || 25;
    const dist = Math.max(12, currentDist);

    const targetPos = new THREE.Vector3(
      face.normal[0] * dist,
      face.normal[1] * dist,
      face.normal[2] * dist
    );
    const targetUp = new THREE.Vector3(face.up[0], face.up[1], face.up[2]);

    animateCameraTo(targetPos, new THREE.Vector3(0, 0, 0), targetUp);
    onViewChange?.(face.id);
  };

  // Arrow clicks (orbiting steps)
  const handleArrowClick = (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'ISO') => {
    if (!camera) return;
    const target = controls?.target ? controls.target.clone() : new THREE.Vector3(0, 0, 0);
    const pos = camera.position.clone().sub(target);
    const r = pos.length() || 25;

    if (dir === 'ISO') {
      const isoPos = new THREE.Vector3(r * 0.7, r * 0.5, r * 0.8).add(target);
      animateCameraTo(isoPos, target, new THREE.Vector3(0, 1, 0));
      return;
    }

    // Convert to spherical coords
    const spherical = new THREE.Spherical().setFromVector3(pos);
    const angleStep = Math.PI / 4; // 45 deg

    if (dir === 'LEFT') {
      spherical.theta -= angleStep;
    } else if (dir === 'RIGHT') {
      spherical.theta += angleStep;
    } else if (dir === 'UP') {
      spherical.phi = Math.max(0.1, spherical.phi - angleStep);
    } else if (dir === 'DOWN') {
      spherical.phi = Math.min(Math.PI - 0.1, spherical.phi + angleStep);
    }

    spherical.makeSafe();
    const newPos = new THREE.Vector3().setFromSpherical(spherical).add(target);
    animateCameraTo(newPos, target, new THREE.Vector3(0, 1, 0));
  };

  const faceBg = darkMode ? '#334155' : '#f2f4f7';
  const faceBorder = darkMode ? '#475569' : '#cbd5e1';
  const faceText = darkMode ? '#e2e8f0' : '#2d3748';
  const hoverBg = '#90af13'; // Osdag Brand Green
  const hoverText = '#ffffff';

  return (
    <div
      className="osdag-navcube-container"
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        width: '100px',
        height: '100px',
        userSelect: 'none',
        zIndex: 20,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title="View Navigation Cube"
    >
      {/* ── Surrounding Directional Compass Arrows ── */}
      {/* Top arrow */}
      <button
        type="button"
        aria-label="Tilt View Up"
        onClick={() => handleArrowClick('UP')}
        onMouseEnter={() => setHoveredItem('arrow-up')}
        onMouseLeave={() => setHoveredItem(null)}
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '20px',
          height: '16px',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="14" height="10" viewBox="0 0 14 10">
          <polygon
            points="7,0 14,10 0,10"
            fill={hoveredItem === 'arrow-up' ? hoverBg : darkMode ? '#94a3b8' : '#64748b'}
            style={{ transition: 'fill 0.15s ease' }}
          />
        </svg>
      </button>

      {/* Bottom arrow */}
      <button
        type="button"
        aria-label="Tilt View Down"
        onClick={() => handleArrowClick('DOWN')}
        onMouseEnter={() => setHoveredItem('arrow-down')}
        onMouseLeave={() => setHoveredItem(null)}
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '20px',
          height: '16px',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="14" height="10" viewBox="0 0 14 10">
          <polygon
            points="0,0 14,0 7,10"
            fill={hoveredItem === 'arrow-down' ? hoverBg : darkMode ? '#94a3b8' : '#64748b'}
            style={{ transition: 'fill 0.15s ease' }}
          />
        </svg>
      </button>

      {/* Left arrow */}
      <button
        type="button"
        aria-label="Rotate View Left"
        onClick={() => handleArrowClick('LEFT')}
        onMouseEnter={() => setHoveredItem('arrow-left')}
        onMouseLeave={() => setHoveredItem(null)}
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '16px',
          height: '20px',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="10" height="14" viewBox="0 0 10 14">
          <polygon
            points="10,0 0,7 10,14"
            fill={hoveredItem === 'arrow-left' ? hoverBg : darkMode ? '#94a3b8' : '#64748b'}
            style={{ transition: 'fill 0.15s ease' }}
          />
        </svg>
      </button>

      {/* Right arrow */}
      <button
        type="button"
        aria-label="Rotate View Right"
        onClick={() => handleArrowClick('RIGHT')}
        onMouseEnter={() => setHoveredItem('arrow-right')}
        onMouseLeave={() => setHoveredItem(null)}
        style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '16px',
          height: '20px',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="10" height="14" viewBox="0 0 10 14">
          <polygon
            points="0,0 10,7 0,14"
            fill={hoveredItem === 'arrow-right' ? hoverBg : darkMode ? '#94a3b8' : '#64748b'}
            style={{ transition: 'fill 0.15s ease' }}
          />
        </svg>
      </button>

      {/* Isometric / Home Button in top-right corner of compass */}
      <button
        type="button"
        aria-label="Reset Isometric View"
        title="Reset to Isometric View"
        onClick={() => handleArrowClick('ISO')}
        onMouseEnter={() => setHoveredItem('btn-iso')}
        onMouseLeave={() => setHoveredItem(null)}
        style={{
          position: 'absolute',
          top: 2,
          right: 2,
          width: '14px',
          height: '14px',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16">
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            stroke={hoveredItem === 'btn-iso' ? hoverBg : darkMode ? '#94a3b8' : '#64748b'}
            strokeWidth="2"
          />
          <circle
            cx="8"
            cy="8"
            r="2"
            fill={hoveredItem === 'btn-iso' ? hoverBg : darkMode ? '#94a3b8' : '#64748b'}
          />
        </svg>
      </button>

      {/* ── 3D ViewCube Scene ── */}
      <div
        style={{
          width: `${CUBE_SIZE}px`,
          height: `${CUBE_SIZE}px`,
          perspective: '450px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: `${CUBE_SIZE}px`,
            height: `${CUBE_SIZE}px`,
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: matrixStyle,
            transition: 'transform 0.05s ease-out',
          }}
        >
          {FACES.map((face) => {
            const isHovered = hoveredItem === face.id;
            return (
              <div
                key={face.id}
                role="button"
                tabIndex={0}
                aria-label={`Align to ${face.label} view`}
                onClick={() => handleFaceClick(face)}
                onMouseEnter={() => setHoveredItem(face.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  position: 'absolute',
                  width: `${CUBE_SIZE}px`,
                  height: `${CUBE_SIZE}px`,
                  background: isHovered ? hoverBg : faceBg,
                  border: `1.5px solid ${isHovered ? hoverBg : faceBorder}`,
                  boxShadow: isHovered
                    ? 'inset 0 0 4px rgba(0,0,0,0.2)'
                    : 'inset 0 0 2px rgba(0,0,0,0.06)',
                  color: isHovered ? hoverText : faceText,
                  fontSize: '9px',
                  fontWeight: 700,
                  fontFamily: '"Ubuntu Sans", "Segoe UI", sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transform: face.transform,
                  backfaceVisibility: 'hidden',
                  transition: 'background 0.12s ease, color 0.12s ease',
                }}
              >
                {face.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
