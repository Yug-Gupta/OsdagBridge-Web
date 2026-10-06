import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Html,
  Line,
} from '@react-three/drei';
import * as THREE from 'three';
import { useBridgeStore, type CadDisplayState } from '../../store/useBridgeStore';
import type { ViewerCadModel } from '../../types/viewerCadModel';
import { CrashBarrierGeometry, MedianGeometry, RailingGeometry } from '../../utils/irc5Geometry';
import { NavCube } from './cad/NavCube';
import { AxisTriad } from './cad/AxisTriad';

/**
 * Desktop CAD Color Palette (from osdagbridge.desktop.ui.cad_3d.py)
 */
const WEB_COLOR = '#2f2f23'; // Quantity_Color(47/255, 47/255, 35/255)
const FLANGE_COLOR = '#868664'; // Quantity_Color(134/255, 134/255, 100/255)
const STIFFENER_COLOR = '#484836'; // Quantity_Color(72/255, 72/255, 54/255)
const DECK_COLOR = '#646464'; // Quantity_Color(100/255, 100/255, 100/255)
const DECK_TEXTURE_COLOR = '#333333'; // Quantity_Color(0.2, 0.2, 0.2)
const BARRIER_COLOR = '#282828'; // Quantity_Color(40/255, 40/255, 40/255)
const WBEAM_COLOR = '#808080'; // Quantity_Color(128/255, 128/255, 128/255)
const BARRIER_POST_COLOR = '#141414'; // Quantity_Color(20/255, 20/255, 20/255)
const BRACING_COLOR = '#3c3c3c'; // Quantity_Color(60/255, 60/255, 60/255)
const SUPPORT_VERTICAL_COLOR = '#005900'; // Quantity_Color(0.0, 0.35, 0.0)
const SUPPORT_TRANSVERSE_COLOR = '#1a1ad9'; // Quantity_Color(0.1, 0.1, 0.85)
const SUPPORT_LONGIT_COLOR = '#d91a1a'; // Quantity_Color(0.85, 0.1, 0.1)
const NODE_COLOR = '#000000';
const ELEM_COLOR = '#BF360C';
const HOVER_HIGHLIGHT_COLOR = '#00E5FF';

const MM = 0.001; // millimetres to metres

interface HoverInfo {
  title: string;
  x: number;
  y: number;
}

// ── CAMERA EXPORTER (bridges Three.js camera to React state outside Canvas) ──
// Fires once when the camera/controls instance is ready, then never again.
// NavCube + AxisTriad read the camera object reference each rAF; they don't
// need BridgeViewer to re-render every frame.
function CameraExporter({
  onCamera,
}: {
  onCamera: (cam: THREE.Camera, ctrl: any) => void;
}) {
  const { camera, controls } = useThree();
  useEffect(() => {
    onCamera(camera, controls);
  }, [camera, controls, onCamera]);
  return null;
}

// ── CAMERA CONTROLLER ────────────────────────────────────────────────────────
function CameraController({
  spanL,
  trigger,
}: {
  spanL: number;
  trigger: number;
}) {
  const { camera, controls } = useThree();

  useEffect(() => {
    if (trigger > 0) {
      // Zoom Fit behavior: reset camera to canonical isometric framing
      const dist = Math.max(12, spanL * 0.9);
      camera.position.set(dist * 0.7, dist * 0.5, dist * 0.8);
      camera.lookAt(0, 0, 0);
      // Reset OrbitControls target if available
      const orbitControls = controls as any;
      if (orbitControls && typeof orbitControls.target?.set === 'function') {
        orbitControls.target.set(0, 0, 0);
        orbitControls.update();
      }
    }
  }, [trigger, spanL, camera, controls]);

  return null;
}

// ── SUPPORT WIREFRAME RECTANGLE ──────────────────────────────────────────────
function SupportWireframe({
  p0,
  p1,
  p2,
  p3,
  color,
  label,
  onHover,
  onLeave,
}: {
  p0: [number, number, number];
  p1: [number, number, number];
  p2: [number, number, number];
  p3: [number, number, number];
  color: string;
  label: string;
  onHover: (e: any, label: string) => void;
  onLeave: () => void;
}) {
  const points = useMemo(() => [p0, p1, p2, p3, p0], [p0, p1, p2, p3]);
  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(e, label);
      }}
      onPointerOut={() => onLeave()}
    >
      <Line points={points} color={color} lineWidth={2.5} />
    </group>
  );
}

// ── SHEAR STUD 3D COMPONENT ──────────────────────────────────────────────────
function ShearStud({
  position,
  baseDia,
  baseH,
  topDia,
  topH,
}: {
  position: [number, number, number];
  baseDia: number;
  baseH: number;
  topDia: number;
  topH: number;
}) {
  return (
    <group position={position}>
      {/* Base cylinder */}
      <mesh position={[0, baseH / 2, 0]} castShadow>
        <cylinderGeometry args={[baseDia / 2, baseDia / 2, baseH, 12]} />
        <meshStandardMaterial color={STIFFENER_COLOR} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Top cap cylinder */}
      <mesh position={[0, baseH + topH / 2, 0]} castShadow>
        <cylinderGeometry args={[topDia / 2, topDia / 2, topH, 12]} />
        <meshStandardMaterial color={STIFFENER_COLOR} metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

// ── SINGLE PLATE GIRDER WITH STIFFENERS & SHEAR STUDS ───────────────────────
function PlateGirderAssembly({
  girderIdx,
  xOffset,
  yOffset,
  p,
  onHover,
  onLeave,
}: {
  girderIdx: number;
  xOffset: number; // longitudinal skew shift (m)
  yOffset: number; // lateral coordinate (m)
  p: ViewerCadModel;
  onHover: (e: any, text: string) => void;
  onLeave: () => void;
}) {
  const L = p.span_length * MM;
  const d = p.girder.d * MM;
  const tw = p.girder.tw * MM;
  const tf = p.girder.tf * MM;
  const tfB = p.girder.tf_b * MM;
  const bf = p.girder.bf * MM;
  const bfB = p.girder.bf_b * MM;
  const webH = Math.max(0.01, d - tf - tfB);

  const webHoverLabel = `Girder Web\nDepth: ${p.girder.d.toFixed(2)} mm\nWeb Thickness: ${p.girder.tw.toFixed(2)} mm\nSteel Grade: ${p.steel_grade}`;
  const topFlangeHoverLabel = `Top Flange\nWidth: ${p.girder.bf.toFixed(2)} mm\nThickness: ${p.girder.tf.toFixed(2)} mm\nSteel Grade: ${p.steel_grade}`;
  const botFlangeHoverLabel = `Bottom Flange\nWidth: ${p.girder.bf_b.toFixed(2)} mm\nThickness: ${p.girder.tf_b.toFixed(2)} mm\nSteel Grade: ${p.steel_grade}`;

  // Intermediate stiffeners
  const stiffeners = useMemo(() => {
    if (!p.include_intermediate_stiffeners) return [];
    const spacing = Math.max(1000, p.intermediate_stiffener_spacing) * MM;
    const n = Math.max(1, Math.floor(L / spacing) - 1);
    const step = L / (n + 1);
    const outstand = (p.intermediate_stiffener_outstand || (bf - tw) / 2) * MM;
    const thickness = p.intermediate_stiffener_thickness * MM;

    const list: { z: number; outstand: number; thickness: number }[] = [];
    for (let i = 1; i <= n; i++) {
      list.push({ z: -L / 2 + i * step, outstand, thickness });
    }
    return list;
  }, [p.include_intermediate_stiffeners, p.intermediate_stiffener_spacing, p.intermediate_stiffener_outstand, p.intermediate_stiffener_thickness, L, bf, tw]);

  // Bearing / End stiffeners
  const endStiffeners = useMemo(() => {
    const pairs = Math.max(1, p.num_end_stiffener_pairs);
    const t = p.end_stiffener_thickness * MM;
    const outstand = (p.end_stiffener_outstand || (bf - tw) / 2) * MM;
    const spacing = 0.05; // 50mm

    const list: { z: number; outstand: number; thickness: number }[] = [];
    for (let i = 0; i < pairs; i++) {
      const offset = i * spacing;
      list.push({ z: -L / 2 + 0.05 + offset, outstand, thickness: t });
      list.push({ z: L / 2 - 0.05 - offset, outstand, thickness: t });
    }
    return list;
  }, [p.num_end_stiffener_pairs, p.end_stiffener_thickness, p.end_stiffener_outstand, L, bf, tw]);

  // Longitudinal stiffeners
  const longitudinalStiffeners = useMemo(() => {
    if (!p.include_longitudinal_stiffeners || p.num_longitudinal_stiffeners <= 0) return [];
    const count = p.num_longitudinal_stiffeners;
    const t = p.longitudinal_stiffener_thickness * MM;
    const outstand = (p.longitudinal_stiffener_outstand || 120) * MM;

    const list: { y: number; outstand: number; thickness: number }[] = [];
    for (let i = 1; i <= count; i++) {
      const fraction = i / (count + 1);
      list.push({ y: tfB + webH * fraction, outstand, thickness: t });
    }
    return list;
  }, [p.include_longitudinal_stiffeners, p.num_longitudinal_stiffeners, p.longitudinal_stiffener_thickness, p.longitudinal_stiffener_outstand, tfB, webH]);

  // Shear studs
  const shearStudPositions = useMemo(() => {
    const ss = p.shear_stud_params;
    if (!ss || ss.pitch <= 0 || ss.num_per_section <= 0) return [];

    const pitchM = ss.pitch * MM;
    const nRows = Math.max(1, Math.floor((L - 0.2) / pitchM));
    const transSpacingM = ss.transverse_spacing * MM;
    const numPerSec = ss.num_per_section;

    const list: [number, number, number][] = [];
    const startZ = -((nRows - 1) * pitchM) / 2;

    for (let r = 0; r < nRows; r++) {
      const zPos = startZ + r * pitchM;
      for (let c = 0; c < numPerSec; c++) {
        const xPos = (c - (numPerSec - 1) / 2) * transSpacingM;
        list.push([xPos, d, zPos]);
      }
    }
    return list;
  }, [p.shear_stud_params, L, d]);

  // Supports
  const baseDim = Math.min(0.1 * L, 0.75 * d);
  const hSupp = baseDim / 1.5;
  const wNarrow = hSupp * 0.25;
  const hShort = hSupp * 0.35;
  const sw = Math.max(bf, bfB);
  const wSupp = baseDim / 2.0;

  const isGuided = girderIdx > 0 && girderIdx < p.num_girders - 1;

  return (
    <group position={[yOffset, 0, xOffset]}>
      {/* 1. GIRDER WEB */}
      <mesh
        position={[0, tfB + webH / 2, 0]}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(e, webHoverLabel);
        }}
        onPointerOut={() => onLeave()}
      >
        <boxGeometry args={[tw, webH, L]} />
        <meshStandardMaterial color={WEB_COLOR} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* 2. GIRDER TOP FLANGE */}
      <mesh
        position={[0, d - tf / 2, 0]}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(e, topFlangeHoverLabel);
        }}
        onPointerOut={() => onLeave()}
      >
        <boxGeometry args={[bf, tf, L]} />
        <meshStandardMaterial color={FLANGE_COLOR} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* 3. GIRDER BOTTOM FLANGE */}
      <mesh
        position={[0, tfB / 2, 0]}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(e, botFlangeHoverLabel);
        }}
        onPointerOut={() => onLeave()}
      >
        <boxGeometry args={[bfB, tfB, L]} />
        <meshStandardMaterial color={FLANGE_COLOR} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* 4. INTERMEDIATE STIFFENERS */}
      {stiffeners.map((stiff, i) => (
        <group key={`int-stiff-${i}`} position={[0, tfB + webH / 2, stiff.z]}>
          {/* Left plate */}
          <mesh
            position={[-tw / 2 - stiff.outstand / 2, 0, 0]}
            castShadow
            onPointerOver={(e) => {
              e.stopPropagation();
              onHover(
                e,
                `Intermediate Stiffener\nSpacing: ${p.intermediate_stiffener_spacing.toFixed(2)} mm\nThickness: ${p.intermediate_stiffener_thickness.toFixed(2)} mm\nSteel Grade: ${p.steel_grade}`,
              );
            }}
            onPointerOut={() => onLeave()}
          >
            <boxGeometry args={[stiff.outstand, webH * 0.96, stiff.thickness]} />
            <meshStandardMaterial color={STIFFENER_COLOR} metalness={0.5} roughness={0.4} />
          </mesh>
          {/* Right plate */}
          <mesh
            position={[tw / 2 + stiff.outstand / 2, 0, 0]}
            castShadow
            onPointerOver={(e) => {
              e.stopPropagation();
              onHover(
                e,
                `Intermediate Stiffener\nSpacing: ${p.intermediate_stiffener_spacing.toFixed(2)} mm\nThickness: ${p.intermediate_stiffener_thickness.toFixed(2)} mm\nSteel Grade: ${p.steel_grade}`,
              );
            }}
            onPointerOut={() => onLeave()}
          >
            <boxGeometry args={[stiff.outstand, webH * 0.96, stiff.thickness]} />
            <meshStandardMaterial color={STIFFENER_COLOR} metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* 5. BEARING / END STIFFENERS */}
      {endStiffeners.map((stiff, i) => (
        <group key={`end-stiff-${i}`} position={[0, tfB + webH / 2, stiff.z]}>
          <mesh
            position={[-tw / 2 - stiff.outstand / 2, 0, 0]}
            castShadow
            onPointerOver={(e) => {
              e.stopPropagation();
              onHover(
                e,
                `Bearing Stiffener\nPairs: ${p.num_end_stiffener_pairs}\nThickness: ${p.end_stiffener_thickness.toFixed(2)} mm\nSteel Grade: ${p.steel_grade}`,
              );
            }}
            onPointerOut={() => onLeave()}
          >
            <boxGeometry args={[stiff.outstand, webH * 0.98, stiff.thickness]} />
            <meshStandardMaterial color={STIFFENER_COLOR} metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh
            position={[tw / 2 + stiff.outstand / 2, 0, 0]}
            castShadow
            onPointerOver={(e) => {
              e.stopPropagation();
              onHover(
                e,
                `Bearing Stiffener\nPairs: ${p.num_end_stiffener_pairs}\nThickness: ${p.end_stiffener_thickness.toFixed(2)} mm\nSteel Grade: ${p.steel_grade}`,
              );
            }}
            onPointerOut={() => onLeave()}
          >
            <boxGeometry args={[stiff.outstand, webH * 0.98, stiff.thickness]} />
            <meshStandardMaterial color={STIFFENER_COLOR} metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* 6. LONGITUDINAL STIFFENERS */}
      {longitudinalStiffeners.map((ls, i) => (
        <group key={`long-stiff-${i}`} position={[0, ls.y, 0]}>
          <mesh
            position={[-tw / 2 - ls.outstand / 2, 0, 0]}
            castShadow
            onPointerOver={(e) => {
              e.stopPropagation();
              onHover(
                e,
                `Longitudinal Stiffener\nCount: ${p.num_longitudinal_stiffeners}\nThickness: ${p.longitudinal_stiffener_thickness.toFixed(2)} mm\nSteel Grade: ${p.steel_grade}`,
              );
            }}
            onPointerOut={() => onLeave()}
          >
            <boxGeometry args={[ls.outstand, ls.thickness, L]} />
            <meshStandardMaterial color={STIFFENER_COLOR} metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh
            position={[tw / 2 + ls.outstand / 2, 0, 0]}
            castShadow
            onPointerOver={(e) => {
              e.stopPropagation();
              onHover(
                e,
                `Longitudinal Stiffener\nCount: ${p.num_longitudinal_stiffeners}\nThickness: ${p.longitudinal_stiffener_thickness.toFixed(2)} mm\nSteel Grade: ${p.steel_grade}`,
              );
            }}
            onPointerOut={() => onLeave()}
          >
            <boxGeometry args={[ls.outstand, ls.thickness, L]} />
            <meshStandardMaterial color={STIFFENER_COLOR} metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* 7. SHEAR STUDS */}
      {shearStudPositions.map((pos, i) => (
        <ShearStud
          key={`stud-${i}`}
          position={pos}
          baseDia={p.shear_stud_params.base_diameter * MM}
          baseH={p.shear_stud_params.base_height * MM}
          topDia={p.shear_stud_params.top_diameter * MM}
          topH={p.shear_stud_params.top_height * MM}
        />
      ))}

      {/* 8. SUPPORTS (WIREFRAME FRAMES - DESKTOP SPEC) */}
      {/* Left support (Z = -L/2) */}
      <group position={[0, 0, -L / 2]}>
        {/* Vertical frame (Portrait, Green) */}
        <SupportWireframe
          p0={[-wNarrow / 2, 0, 0]}
          p1={[wNarrow / 2, 0, 0]}
          p2={[wNarrow / 2, -hSupp, 0]}
          p3={[-wNarrow / 2, -hSupp, 0]}
          color={SUPPORT_VERTICAL_COLOR}
          label="Support - Vertical"
          onHover={onHover}
          onLeave={onLeave}
        />
        {/* Wide horizontal frame (Transverse restraint, Landscape, Blue) */}
        <SupportWireframe
          p0={[-sw / 2, 0, 0]}
          p1={[sw / 2, 0, 0]}
          p2={[sw / 2, -hShort, 0]}
          p3={[-sw / 2, -hShort, 0]}
          color={SUPPORT_TRANSVERSE_COLOR}
          label="Support - Transverse"
          onHover={onHover}
          onLeave={onLeave}
        />
        {/* Longitudinal frame (Span restraint, Red) */}
        <SupportWireframe
          p0={[0, 0, 0]}
          p1={[0, 0, wSupp]}
          p2={[0, -hShort, wSupp]}
          p3={[0, -hShort, 0]}
          color={SUPPORT_LONGIT_COLOR}
          label="Support - Longitudinal"
          onHover={onHover}
          onLeave={onLeave}
        />
      </group>

      {/* Right support (Z = L/2) */}
      <group position={[0, 0, L / 2]}>
        {/* Vertical frame (Portrait, Green) */}
        <SupportWireframe
          p0={[-wNarrow / 2, 0, 0]}
          p1={[wNarrow / 2, 0, 0]}
          p2={[wNarrow / 2, -hSupp, 0]}
          p3={[-wNarrow / 2, -hSupp, 0]}
          color={SUPPORT_VERTICAL_COLOR}
          label="Support - Vertical"
          onHover={onHover}
          onLeave={onLeave}
        />
        {/* Wide horizontal frame (Guided rollers only) */}
        {isGuided && (
          <SupportWireframe
            p0={[-sw / 2, 0, 0]}
            p1={[sw / 2, 0, 0]}
            p2={[sw / 2, -hShort, 0]}
            p3={[-sw / 2, -hShort, 0]}
            color={SUPPORT_TRANSVERSE_COLOR}
            label="Support - Transverse"
            onHover={onHover}
            onLeave={onLeave}
          />
        )}
      </group>
    </group>
  );
}

// ── CROSS BRACING FRAME ──────────────────────────────────────────────────────
function CrossBracingFrame({
  y1,
  y2,
  z1,
  z2,
  yBottom,
  yTop,
  p,
  onHover,
  onLeave,
}: {
  y1: number;
  y2: number;
  z1: number;
  z2: number;
  yBottom: number;
  yTop: number;
  p: ViewerCadModel;
  onHover: (e: any, text: string) => void;
  onLeave: () => void;
}) {
  const hoverText = `Cross Bracing\nType: ${p.bracing_type}-Bracing\nSpacing: ${p.cross_bracing_spacing.toFixed(2)} mm\nSection: ${p.diagonal_section_type}\nLeg H: ${p.diagonal_section_dims.leg_h.toFixed(2)} mm\nLeg W: ${p.diagonal_section_dims.leg_w.toFixed(2)} mm`;

  const chordThickness = (p.top_chord_thickness || 8) * MM;
  const diagThickness = (p.diagonal_thickness || 8) * MM;

  // Diagonal 1: (y1, yBottom, z1) -> (y2, yTop, z2)
  const pA1 = new THREE.Vector3(y1, yBottom, z1);
  const pA2 = new THREE.Vector3(y2, yTop, z2);
  const vA = new THREE.Vector3().subVectors(pA2, pA1);
  const lenA = vA.length();
  const midA = new THREE.Vector3().addVectors(pA1, pA2).multiplyScalar(0.5);

  // Diagonal 2: (y1, yTop, z1) -> (y2, yBottom, z2)
  const pB1 = new THREE.Vector3(y1, yTop, z1);
  const pB2 = new THREE.Vector3(y2, yBottom, z2);
  const vB = new THREE.Vector3().subVectors(pB2, pB1);
  const lenB = vB.length();
  const midB = new THREE.Vector3().addVectors(pB1, pB2).multiplyScalar(0.5);

  // Top Chord: (y1, yTop, z1) -> (y2, yTop, z2)
  const vTop = new THREE.Vector3().subVectors(pB1, pA2);
  const lenTop = vTop.length();
  const midTop = new THREE.Vector3().addVectors(pB1, pA2).multiplyScalar(0.5);

  // Bottom Chord: (y1, yBottom, z1) -> (y2, yBottom, z2)
  const vBot = new THREE.Vector3().subVectors(pA1, pB2);
  const lenBot = vBot.length();
  const midBot = new THREE.Vector3().addVectors(pA1, pB2).multiplyScalar(0.5);

  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(e, hoverText);
      }}
      onPointerOut={() => onLeave()}
    >
      {/* Top Chord */}
      <mesh position={midTop} castShadow>
        <boxGeometry args={[Math.abs(y2 - y1), chordThickness, 0.08]} />
        <meshStandardMaterial color={BRACING_COLOR} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Bottom Chord */}
      <mesh position={midBot} castShadow>
        <boxGeometry args={[Math.abs(y2 - y1), chordThickness, 0.08]} />
        <meshStandardMaterial color={BRACING_COLOR} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Diagonals (X-Bracing) */}
      {p.bracing_type === 'X' ? (
        <>
          <Line points={[pA1, pA2]} color={BRACING_COLOR} lineWidth={3} />
          <Line points={[pB1, pB2]} color={BRACING_COLOR} lineWidth={3} />
        </>
      ) : (
        /* K-Bracing */
        <>
          <Line
            points={[
              pA1,
              new THREE.Vector3((y1 + y2) / 2, (yBottom + yTop) / 2, (z1 + z2) / 2),
            ]}
            color={BRACING_COLOR}
            lineWidth={3}
          />
          <Line
            points={[
              pB2,
              new THREE.Vector3((y1 + y2) / 2, (yBottom + yTop) / 2, (z1 + z2) / 2),
            ]}
            color={BRACING_COLOR}
            lineWidth={3}
          />
        </>
      )}
    </group>
  );
}

// ── CRASH BARRIER COMPONENT (IRC 5) ──────────────────────────────────────────
function CrashBarrierMesh({
  lateralY,
  length,
  onDeckY,
  p,
  onHover,
  onLeave,
}: {
  lateralY: number;
  length: number;
  onDeckY: number;
  p: ViewerCadModel;
  onHover: (e: any, text: string) => void;
  onLeave: () => void;
}) {
  const geo = CrashBarrierGeometry.get_geometry(p.barrier_type);
  const hoverText = `Crash Barrier\nType: ${p.barrier_type}\nSubtype: ${p.crash_barrier_subtype}`;

  if (!geo) return null;

  if (geo.type === 'rcc') {
    const h = geo.total_height * MM;
    const topW = geo.top_width * MM;
    const botW = geo.bottom_width * MM;
    const baseH = h * 0.55;
    const topH = h * 0.45;

    return (
      <group
        position={[lateralY, onDeckY, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(e, hoverText);
        }}
        onPointerOut={() => onLeave()}
      >
        <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[botW, baseH, length]} />
          <meshStandardMaterial color={BARRIER_COLOR} roughness={0.7} />
        </mesh>
        <mesh position={[0, baseH + topH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[topW, topH, length]} />
          <meshStandardMaterial color={BARRIER_COLOR} roughness={0.7} />
        </mesh>
      </group>
    );
  }

  // Metallic barrier: kerb + vertical posts + W-beams
  const postH = geo.post_height * MM;
  const kerbH = geo.kerb_height * MM;
  const postSpacing = 2.0;
  const nPosts = Math.max(2, Math.round(length / postSpacing));

  return (
    <group
      position={[lateralY, onDeckY, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(e, hoverText);
      }}
      onPointerOut={() => onLeave()}
    >
      {/* Kerb */}
      <mesh position={[0, kerbH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.35, kerbH, length]} />
        <meshStandardMaterial color={BARRIER_POST_COLOR} roughness={0.8} />
      </mesh>
      {/* Posts */}
      {Array.from({ length: nPosts }, (_, i) => (
        <mesh
          key={i}
          position={[0, kerbH + postH / 2, -length / 2 + (i + 0.5) * (length / nPosts)]}
          castShadow
        >
          <boxGeometry args={[0.08, postH, 0.08]} />
          <meshStandardMaterial color={BARRIER_POST_COLOR} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {/* W-beams */}
      {Array.from({ length: geo.w_beams }, (_, i) => (
        <mesh
          key={`wb-${i}`}
          position={[0, kerbH + postH * (0.55 + i * 0.3), 0]}
          castShadow
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover(e, 'W-Beam');
          }}
        >
          <boxGeometry args={[0.12, 0.28, length]} />
          <meshStandardMaterial color={WBEAM_COLOR} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ── MEDIAN BARRIER COMPONENT (IRC 5) ─────────────────────────────────────────
function MedianBarrierMesh({
  length,
  onDeckY,
  p,
  onHover,
  onLeave,
}: {
  length: number;
  onDeckY: number;
  p: ViewerCadModel;
  onHover: (e: any, text: string) => void;
  onLeave: () => void;
}) {
  const geo = MedianGeometry.get_geometry(p.median_type);
  const hoverText = `Median Barrier\nType: ${p.median_type}`;

  if (!geo) return null;

  if (geo.type === 'kerb') {
    const h = geo.kerb_height * MM;
    return (
      <mesh
        position={[0, onDeckY + h / 2, 0]}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(e, hoverText);
        }}
        onPointerOut={() => onLeave()}
      >
        <boxGeometry args={[geo.kerb_bottom_width * MM, h, length]} />
        <meshStandardMaterial color={BARRIER_COLOR} roughness={0.75} />
      </mesh>
    );
  }

  if (geo.type === 'rcc_barrier') {
    const h = geo.barrier_height * MM;
    return (
      <mesh
        position={[0, onDeckY + h / 2, 0]}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(e, hoverText);
        }}
        onPointerOut={() => onLeave()}
      >
        <boxGeometry args={[geo.bottom_width * MM, h, length]} />
        <meshStandardMaterial color={BARRIER_COLOR} roughness={0.75} />
      </mesh>
    );
  }

  // Metallic
  const postH = geo.post_height * MM;
  const nPosts = Math.max(2, Math.round(length / 2.0));
  return (
    <group
      position={[0, onDeckY, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(e, hoverText);
      }}
      onPointerOut={() => onLeave()}
    >
      {Array.from({ length: nPosts }, (_, i) => (
        <mesh
          key={i}
          position={[0, postH / 2, -length / 2 + (i + 0.5) * (length / nPosts)]}
          castShadow
        >
          <boxGeometry args={[0.08, postH, 0.08]} />
          <meshStandardMaterial color={BARRIER_POST_COLOR} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {Array.from({ length: geo.w_beams }, (_, i) => (
        <mesh
          key={`mwb-${i}`}
          position={[0, postH * (0.55 + i * 0.3), 0]}
          castShadow
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover(e, 'Median W-Beam');
          }}
        >
          <boxGeometry args={[0.12, 0.28, length]} />
          <meshStandardMaterial color={WBEAM_COLOR} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ── RAILING COMPONENT (IRC 5) ────────────────────────────────────────────────
function RailingMesh({
  lateralY,
  length,
  onDeckY,
  p,
  onHover,
  onLeave,
}: {
  lateralY: number;
  length: number;
  onDeckY: number;
  p: ViewerCadModel;
  onHover: (e: any, text: string) => void;
  onLeave: () => void;
}) {
  const geo = RailingGeometry.get_geometry(p.railing_type);
  const hoverText = `Railing\nType: ${p.railing_type.toUpperCase()}\nRails: ${p.rail_count}\nWidth: ${p.railing_width.toFixed(2)} mm`;

  if (!geo) return null;

  const h = geo.height * MM;
  const w = geo.width * MM;
  const postSpacing = (geo.post_spacing || 2000) * MM;

  if (geo.type === 'steel') {
    const nPosts = Math.max(2, Math.round(length / postSpacing));
    return (
      <group
        position={[lateralY, onDeckY, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(e, hoverText);
        }}
        onPointerOut={() => onLeave()}
      >
        {Array.from({ length: nPosts }, (_, i) => (
          <mesh
            key={i}
            position={[0, h / 2, -length / 2 + (i + 0.5) * (length / nPosts)]}
            castShadow
          >
            <boxGeometry args={[geo.post_dia * MM, h, geo.post_dia * MM]} />
            <meshStandardMaterial color={BARRIER_POST_COLOR} metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
        {Array.from({ length: geo.rail_count }, (_, i) => (
          <mesh key={`rail-${i}`} position={[0, h * (0.35 + i * 0.3), 0]} castShadow>
            <boxGeometry args={[0.06, 0.06, length]} />
            <meshStandardMaterial color={BARRIER_POST_COLOR} metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group
      position={[lateralY, onDeckY, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(e, hoverText);
      }}
      onPointerOut={() => onLeave()}
    >
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, length]} />
        <meshStandardMaterial color={BARRIER_COLOR} roughness={0.75} />
      </mesh>
    </group>
  );
}

// ── FOOTPATH SLAB COMPONENT ──────────────────────────────────────────────────
function FootpathSlab({
  lateralY,
  width,
  thickness,
  length,
  deckTopY,
  overhangShift,
  onHover,
  onLeave,
}: {
  lateralY: number;
  width: number;
  thickness: number;
  length: number;
  deckTopY: number;
  overhangShift: number;
  onHover: (e: any, text: string) => void;
  onLeave: () => void;
}) {
  const FOOTPATH_COLOR = '#5a5a5a';
  return (
    <mesh
      position={[lateralY + overhangShift, deckTopY + thickness / 2, 0]}
      castShadow
      receiveShadow
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(e, `Footpath Slab\nWidth: ${(width * 1000).toFixed(0)} mm\nThickness: ${(thickness * 1000).toFixed(0)} mm`);
      }}
      onPointerOut={() => onLeave()}
    >
      <boxGeometry args={[width, thickness, length]} />
      <meshStandardMaterial color={FOOTPATH_COLOR} roughness={0.7} />
    </mesh>
  );
}

// ── WEARING COURSE LAYER ─────────────────────────────────────────────────────
function WearingCourse({
  width,
  thickness,
  length,
  deckTopY,
  onHover,
  onLeave,
}: {
  width: number;
  thickness: number;
  length: number;
  deckTopY: number;
  onHover: (e: any, text: string) => void;
  onLeave: () => void;
}) {
  if (thickness <= 0) return null;
  return (
    <mesh
      position={[0, deckTopY + thickness / 2, 0]}
      castShadow
      receiveShadow
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(e, `Wearing Course\nThickness: ${(thickness * 1000).toFixed(0)} mm`);
      }}
      onPointerOut={() => onLeave()}
    >
      <boxGeometry args={[width, thickness, length]} />
      <meshStandardMaterial color='#1a1a1a' roughness={0.85} />
    </mesh>
  );
}

// ── DIMENSION ANNOTATION LINE ─────────────────────────────────────────────────
function DimensionLine({
  p1,
  p2,
  label,
  color = '#e2e8f0',
  offsetY = 0,
}: {
  p1: [number, number, number];
  p2: [number, number, number];
  label: string;
  color?: string;
  offsetY?: number;
}) {
  const mid: [number, number, number] = [
    (p1[0] + p2[0]) / 2,
    (p1[1] + p2[1]) / 2 + offsetY,
    (p1[2] + p2[2]) / 2,
  ];
  return (
    <group>
      <Line points={[p1, p2]} color={color} lineWidth={1.2} dashed dashSize={0.3} gapSize={0.15} />
      <Html position={mid} center distanceFactor={25}>
        <div
          style={{
            color: '#f8fafc',
            fontSize: '10px',
            fontWeight: 700,
            background: 'rgba(15,23,42,0.82)',
            padding: '2px 5px',
            borderRadius: '3px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            letterSpacing: '0.03em',
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

// ── GIRDER NUMBER LABEL ───────────────────────────────────────────────────────
function GirderLabel({
  girderIdx,
  lateralY,
  bottomY,
  girderCount,
}: {
  girderIdx: number;
  lateralY: number;
  bottomY: number;
  girderCount: number;
}) {
  const label = `G${girderCount - girderIdx}`; // G1 at right, Gn at left (matches desktop)
  return (
    <Html
      position={[lateralY, bottomY - 0.15, 0]}
      center
      distanceFactor={20}
    >
      <div
        style={{
          color: '#0f172a',
          fontSize: '10px',
          fontWeight: 800,
          background: 'rgba(241,245,249,0.92)',
          padding: '1px 4px',
          borderRadius: '2px',
          border: '1px solid #94a3b8',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {label}
      </div>
    </Html>
  );
}

// ── MAIN BRIDGE MODEL ASSEMBLY ───────────────────────────────────────────────
function FullBridgeModel({
  p,
  onHover,
  onLeave,
}: {
  p: ViewerCadModel;
  onHover: (e: any, text: string) => void;
  onLeave: () => void;
}) {
  const { cadComponents, cadDisplay } = useBridgeStore();

  const isGirder = cadComponents.bridge || cadComponents.girder;
  const isDeck = cadComponents.bridge || cadComponents.deck;
  const isBracing = cadComponents.bridge || cadComponents.crossBracing;
  const isBarrier = cadComponents.bridge || cadComponents.crashBarrier;
  const isMedian = (cadComponents.bridge || cadComponents.median) && p.median_enabled;
  const isRailing = (cadComponents.bridge || cadComponents.railing) && p.footpath_config !== 'NONE';

  const L = p.span_length * MM;
  const d = p.girder.d * MM;
  const tf = p.girder.tf * MM;
  const tfB = p.girder.tf_b * MM;
  const deckT = p.deck_thickness * MM;
  const nGirders = Math.max(2, p.num_girders);
  const girderSpacingM = p.girder_spacing * MM;
  const carriagewayM = p.carriageway_width * MM;
  const deckOverhangM = (p.deck_overhang || 0) * MM;
  const wearingCourseM = (p.wearing_course_thickness || 0) * MM;
  const footpathWidthM = p.footpath_width * MM;
  const footpathThicknessM = p.footpath_thickness * MM;
  const skewRad = (p.skew_angle * Math.PI) / 180;
  const skewTan = Math.tan(skewRad);

  const nFootpaths = p.footpath_config === 'BOTH' ? 2 : p.footpath_config === 'NONE' ? 0 : 1;
  const footpathTotalM = nFootpaths * footpathWidthM;
  const totalDeckWidthM = carriagewayM + footpathTotalM;

  // Total deck width includes overhang on both sides
  const totalGirderWidthM = (nGirders - 1) * girderSpacingM;
  // Deck extends from -(totalDeckWidthM/2) to +(totalDeckWidthM/2), centered on girder band
  const girderYOffsets = useMemo(
    () => Array.from({ length: nGirders }, (_, i) => i * girderSpacingM - totalGirderWidthM / 2),
    [nGirders, girderSpacingM, totalGirderWidthM],
  );

  const deckTopY = d + deckT;
  const wearingCourseTopY = deckTopY + wearingCourseM;
  const barrierWidthM = p.crash_barrier_width * MM;
  // Barriers sit at deck edge (accounting for footpaths)
  const barrierY = totalDeckWidthM / 2 - barrierWidthM / 2;
  const railingWidthM = p.railing_width * MM;
  const railingY = totalDeckWidthM / 2 - railingWidthM / 2;

  // Footpath positions
  const footpathLeftY = -(carriagewayM / 2 + footpathWidthM / 2);
  const footpathRightY = carriagewayM / 2 + footpathWidthM / 2;

  // Cross bracing stations
  const bracingSpacingM = Math.max(1000, p.cross_bracing_spacing) * MM;
  const nBracingPanels = Math.max(2, Math.round(L / bracingSpacingM));
  const bracingStep = L / nBracingPanels;
  const bracingStations = useMemo(() => {
    const list: number[] = [];
    for (let i = 0; i <= nBracingPanels; i++) {
      list.push(-L / 2 + i * bracingStep);
    }
    return list;
  }, [L, nBracingPanels, bracingStep]);

  const deckHoverText = `Deck Slab\nThickness: ${p.deck_thickness.toFixed(2)} mm\nCarriageway Width: ${p.carriageway_width.toFixed(2)} mm\nConcrete Grade: ${p.concrete_grade}\nFootpath: ${p.footpath_config}`;

  return (
    <group position={[0, -d, 0]}>
      {/* ── GIRDERS ── */}
      {isGirder &&
        girderYOffsets.map((yOffset, i) => {
          const xSkewOffset = yOffset * skewTan;
          return (
            <PlateGirderAssembly
              key={`girder-${i}`}
              girderIdx={i}
              xOffset={xSkewOffset}
              yOffset={yOffset}
              p={p}
              onHover={onHover}
              onLeave={onLeave}
            />
          );
        })}

      {/* ── CROSS BRACINGS & DIAPHRAGMS ── */}
      {isBracing &&
        bracingStations.map((rawZ, sIdx) => (
          <group key={`bracing-station-${sIdx}`}>
            {girderYOffsets.slice(0, -1).map((y1, gIdx) => {
              const y2 = girderYOffsets[gIdx + 1];
              const z1 = rawZ + y1 * skewTan;
              const z2 = rawZ + y2 * skewTan;
              return (
                <CrossBracingFrame
                  key={`frame-${sIdx}-${gIdx}`}
                  y1={y1}
                  y2={y2}
                  z1={z1}
                  z2={z2}
                  yBottom={tfB}
                  yTop={d - tf}
                  p={p}
                  onHover={onHover}
                  onLeave={onLeave}
                />
              );
            })}
          </group>
        ))}

      {/* ── DECK SLAB & TEXTURES ── */}
      {isDeck && (
        <group>
          {/* Main concrete deck slab (carriageway width only for slab body) */}
          <mesh
            position={[0, d + deckT / 2, 0]}
            castShadow
            receiveShadow
            onPointerOver={(e) => {
              e.stopPropagation();
              onHover(e, deckHoverText);
            }}
            onPointerOut={() => onLeave()}
          >
            <boxGeometry args={[totalDeckWidthM, deckT, L]} />
            <meshStandardMaterial color={DECK_COLOR} roughness={0.7} />
          </mesh>

          {/* Wearing Course layer on top of deck (dark asphalt layer) */}
          {wearingCourseM > 0 && (
            <WearingCourse
              width={carriagewayM}
              thickness={wearingCourseM}
              length={L}
              deckTopY={deckTopY}
              onHover={onHover}
              onLeave={onLeave}
            />
          )}

          {/* Footpath slabs (LEFT/RIGHT/BOTH) */}
          {nFootpaths > 0 && (p.footpath_config === 'LEFT' || p.footpath_config === 'BOTH') && (
            <FootpathSlab
              lateralY={footpathLeftY}
              width={footpathWidthM}
              thickness={footpathThicknessM}
              length={L}
              deckTopY={deckTopY}
              overhangShift={0}
              onHover={onHover}
              onLeave={onLeave}
            />
          )}
          {nFootpaths > 0 && (p.footpath_config === 'RIGHT' || p.footpath_config === 'BOTH') && (
            <FootpathSlab
              lateralY={footpathRightY}
              width={footpathWidthM}
              thickness={footpathThicknessM}
              length={L}
              deckTopY={deckTopY}
              overhangShift={0}
              onHover={onHover}
              onLeave={onLeave}
            />
          )}

          {/* Deck Textures (Lane markings & divider lines on carriageway surface) */}
          <group position={[0, (wearingCourseM > 0 ? wearingCourseTopY : deckTopY) + 0.002, 0]}>
            {/* Center line */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.15, 0.002, L]} />
              <meshBasicMaterial color={DECK_TEXTURE_COLOR} />
            </mesh>
            {/* Left lane border */}
            <mesh position={[-carriagewayM / 2 + 0.2, 0, 0]}>
              <boxGeometry args={[0.15, 0.002, L]} />
              <meshBasicMaterial color={DECK_TEXTURE_COLOR} />
            </mesh>
            {/* Right lane border */}
            <mesh position={[carriagewayM / 2 - 0.2, 0, 0]}>
              <boxGeometry args={[0.15, 0.002, L]} />
              <meshBasicMaterial color={DECK_TEXTURE_COLOR} />
            </mesh>
          </group>
        </group>
      )}

      {/* ── CRASH BARRIERS (Independent structural component) ── */}
      {isBarrier && (
        <group>
          <CrashBarrierMesh
            lateralY={-barrierY}
            length={L}
            onDeckY={deckTopY}
            p={p}
            onHover={onHover}
            onLeave={onLeave}
          />
          <CrashBarrierMesh
            lateralY={barrierY}
            length={L}
            onDeckY={deckTopY}
            p={p}
            onHover={onHover}
            onLeave={onLeave}
          />
        </group>
      )}

      {/* ── MEDIAN BARRIER (Independent structural component) ── */}
      {isMedian && (
        <group>
          <MedianBarrierMesh
            length={L}
            onDeckY={deckTopY}
            p={p}
            onHover={onHover}
            onLeave={onLeave}
          />
        </group>
      )}

      {/* ── RAILINGS (Independent pedestrian component) ── */}
      {isRailing && (
        <group>
          <RailingMesh
            lateralY={-railingY}
            length={L}
            onDeckY={deckTopY}
            p={p}
            onHover={onHover}
            onLeave={onLeave}
          />
          {p.footpath_config === 'BOTH' && (
            <RailingMesh
              lateralY={railingY}
              length={L}
              onDeckY={deckTopY}
              p={p}
              onHover={onHover}
              onLeave={onLeave}
            />
          )}
        </group>
      )}

      {/* ── GIRDER NUMBER LABELS (TOOLBAR OVERLAY) ── */}
      {cadDisplay.girderLabels &&
        girderYOffsets.map((yOffset, i) => (
          <GirderLabel
            key={`girder-label-${i}`}
            girderIdx={i}
            lateralY={yOffset}
            bottomY={-tfB - 0.1}
            girderCount={nGirders}
          />
        ))}

      {/* ── GRILLAGE VIEW (TOOLBAR OVERLAY) ── */}
      {cadDisplay.grillageView && p.members && p.nodes && (
        <group>
          {Object.values(p.members).map((m) => {
            const n1 = p.nodes?.[m.node1];
            const n2 = p.nodes?.[m.node2];
            if (!n1 || !n2) return null;

            // Layer 1 at deck top
            const p1Top = new THREE.Vector3(n1.y, deckTopY + 0.01, n1.x - L / 2);
            const p2Top = new THREE.Vector3(n2.y, deckTopY + 0.01, n2.x - L / 2);

            // Layer 2 below deck slab
            const p1Bot = new THREE.Vector3(n1.y, d - 0.01, n1.x - L / 2);
            const p2Bot = new THREE.Vector3(n2.y, d - 0.01, n2.x - L / 2);

            return (
              <group key={`grillage-member-${m.id}`}>
                <Line points={[p1Top, p2Top]} color="#111111" lineWidth={2} />
                <Line points={[p1Bot, p2Bot]} color="#222222" lineWidth={1.5} />
              </group>
            );
          })}
        </group>
      )}

      {/* ── NODES (TOOLBAR OVERLAY) ── */}
      {cadDisplay.nodes && p.nodes && (
        <group>
          {Object.values(p.nodes).map((node) => {
            const pos: [number, number, number] = [node.y, deckTopY + 0.02, node.x - L / 2];
            return (
              <mesh
                key={`node-${node.id}`}
                position={pos}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  onHover(e, node.label);
                }}
                onPointerOut={() => onLeave()}
              >
                <sphereGeometry args={[0.07, 16, 16]} />
                <meshBasicMaterial color={NODE_COLOR} />
              </mesh>
            );
          })}
        </group>
      )}

      {/* ── NODE NUMBERS (TOOLBAR OVERLAY) ── */}
      {cadDisplay.nodeNumbers && p.nodes && (
        <group>
          {Object.values(p.nodes).map((node) => {
            const pos: [number, number, number] = [node.y, deckTopY + 0.18, node.x - L / 2];
            return (
              <Html key={`nodenum-${node.id}`} position={pos} center distanceFactor={20}>
                <div
                  style={{
                    color: '#0d0d0d',
                    fontSize: '11px',
                    fontWeight: 700,
                    userSelect: 'none',
                    pointerEvents: 'none',
                    background: 'rgba(255, 255, 255, 0.85)',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    border: '1px solid #ccc',
                  }}
                >
                  {node.id}
                </div>
              </Html>
            );
          })}
        </group>
      )}

      {/* ── ELEMENT NUMBERS (TOOLBAR OVERLAY) ── */}
      {cadDisplay.elementNumbers && p.members && p.nodes && (
        <group>
          {Object.values(p.members).map((m) => {
            const n1 = p.nodes?.[m.node1];
            const n2 = p.nodes?.[m.node2];
            if (!n1 || !n2) return null;

            const midY = (n1.y + n2.y) / 2;
            const midZ = (n1.x + n2.x) / 2 - L / 2;
            const pos: [number, number, number] = [midY, deckTopY + 0.12, midZ];

            return (
              <Html key={`elemnum-${m.id}`} position={pos} center distanceFactor={22}>
                <div
                  style={{
                    color: ELEM_COLOR,
                    fontSize: '10px',
                    fontWeight: 800,
                    userSelect: 'none',
                    pointerEvents: 'none',
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    border: '1px solid #ffccbc',
                  }}
                >
                  E{m.id}
                </div>
              </Html>
            );
          })}
        </group>
      )}
    </group>
  );
}

// ── COMPONENT PROPS ──────────────────────────────────────────────────────────
export interface BridgeViewerProps {
  params?: ViewerCadModel | null;
  showDeck?: boolean;
  darkMode?: boolean;
  cadDisplay?: CadDisplayState;
  cadZoom?: number;
  activeNavTool?: 'rotate' | 'pan' | 'zoom_window';
}

// ── EXPORTED VIEWER COMPONENT ────────────────────────────────────────────────
export const BridgeViewer: React.FC<BridgeViewerProps> = ({
  params,
  showDeck,
  darkMode = false,
  cadDisplay,
  cadZoom = 1,
  activeNavTool = 'rotate',
}) => {
  const { cadCameraTrigger } = useBridgeStore();

  // Camera ref for NavCube / AxisTriad overlay components
  const [liveCam, setLiveCam] = useState<THREE.Camera | null>(null);
  const [liveCtrl, setLiveCtrl] = useState<any>(null);
  const handleCameraExport = useCallback((cam: THREE.Camera, ctrl: any) => {
    setLiveCam(cam);
    setLiveCtrl(ctrl);
  }, []);

  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  const handleHover = (e: any, text: string) => {
    setHoverInfo({
      title: text,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleLeave = () => {
    setHoverInfo(null);
  };

  const L = params ? params.span_length * MM : 30;
  const camDist = Math.max(12, L * 0.9);

  // Compute info table dimensions
  const totalWidthM = params
    ? (params.carriageway_width +
        (params.footpath_config === 'BOTH' ? 2 : params.footpath_config === 'NONE' ? 0 : 1) *
          params.footpath_width) *
      MM
    : 0;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{
          width: '100%',
          height: '100%',
          background: darkMode
            ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
            : 'linear-gradient(180deg, #ffffff 0%, #7e7e7e 100%)',
          touchAction: 'none',
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.setClearColor(0x000000, 0); // let CSS background gradient show through
        }}
      >
        <PerspectiveCamera
          makeDefault
          position={[camDist * 0.65, camDist * 0.45, camDist * 0.75]}
          fov={42}
          near={0.1}
          far={1000}
        />

        <CameraExporter onCamera={handleCameraExport} />
        <CameraController spanL={L} trigger={cadCameraTrigger} />

        {/* Lighting – mimics desktop OCC viewer warm overhead fill */}
        <ambientLight intensity={darkMode ? 0.4 : 0.65} />
        <hemisphereLight
          args={[
            darkMode ? '#b0bec5' : '#ffffff',
            darkMode ? '#263238' : '#9e9e9e',
            darkMode ? 0.45 : 0.6,
          ]}
        />
        <directionalLight
          position={[20, 30, 20]}
          intensity={darkMode ? 1.1 : 1.3}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-15, 12, -15]} intensity={darkMode ? 0.35 : 0.45} />
        <directionalLight position={[0, -10, 0]} intensity={0.1} />

        <OrbitControls
          makeDefault
          enableRotate={activeNavTool === 'rotate'}
          enablePan={activeNavTool === 'pan' || activeNavTool === 'rotate'}
          enableZoom
          enableDamping
          dampingFactor={0.08}
          minDistance={2}
          maxDistance={300}
          screenSpacePanning
          mouseButtons={{
            LEFT: activeNavTool === 'pan' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
        />

        {/* Bridge model */}
        {params && (
          <FullBridgeModel p={params} onHover={handleHover} onLeave={handleLeave} />
        )}
      </Canvas>

      {/* ── NAVCUBE OVERLAY (top-right, HTML over Canvas) ── */}
      <NavCube
        camera={liveCam}
        controls={liveCtrl}
        darkMode={darkMode}
      />

      {/* ── AXIS TRIAD OVERLAY (bottom-right, only when axis display enabled) ── */}
      {cadDisplay?.axis && (
        <AxisTriad camera={liveCam} size={84} armLen={28} />
      )}

      {/* ── DESKTOP LEGEND / INFO TABLE OVERLAY (CAD 3D ONLY) ── */}
      {cadDisplay?.legend && params && (
        <div
          className="cad-info-table"
          style={{
            position: 'absolute',
            left: 12,
            bottom: 12,
            background: 'rgba(255, 255, 255, 0.92)',
            border: '1px solid #bdbdbd',
            borderRadius: '4px',
            padding: '8px 12px',
            fontSize: '11px',
            color: '#111',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            userSelect: 'none',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto', gap: '3px 12px' }}>
            <span style={{ fontWeight: 700, color: '#444' }}>Overall Bridge Width:</span>
            <span style={{ fontWeight: 600 }}>{totalWidthM.toFixed(2)}</span>
            <span style={{ color: '#666' }}>m</span>

            <span style={{ fontWeight: 700, color: '#444' }}>Span Length:</span>
            <span style={{ fontWeight: 600 }}>{(params.span_length / 1000).toFixed(2)}</span>
            <span style={{ color: '#666' }}>m</span>

            <span style={{ fontWeight: 700, color: '#444' }}>Girder Spacing:</span>
            <span style={{ fontWeight: 600 }}>{(params.girder_spacing / 1000).toFixed(2)}</span>
            <span style={{ color: '#666' }}>m</span>

            <span style={{ fontWeight: 700, color: '#444' }}>Deck Thickness:</span>
            <span style={{ fontWeight: 600 }}>{params.deck_thickness.toFixed(0)}</span>
            <span style={{ color: '#666' }}>mm</span>
          </div>
        </div>
      )}

      {/* ── INTERACTIVE HOVER TOOLTIP ── */}
      {hoverInfo && (
        <div
          style={{
            position: 'fixed',
            left: hoverInfo.x + 14,
            top: hoverInfo.y + 14,
            background: 'rgba(24, 24, 27, 0.95)',
            color: '#f8fafc',
            border: '1px solid #52525b',
            borderRadius: '4px',
            padding: '6px 10px',
            fontSize: '11px',
            lineHeight: 1.45,
            whiteSpace: 'pre-line',
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {hoverInfo.title}
        </div>
      )}

      {/* Viewport hint */}
      <div
        style={{
          position: 'absolute',
          left: 10,
          bottom: cadDisplay?.legend ? 110 : 10,
          padding: '4px 8px',
          borderRadius: '4px',
          background: 'rgba(15, 23, 42, 0.65)',
          color: '#e2e8f0',
          fontSize: '10px',
          letterSpacing: '0.02em',
          pointerEvents: 'none',
          userSelect: 'none',
          transition: 'bottom 0.2s ease',
        }}
      >
        Left-drag: {activeNavTool === 'pan' ? 'Pan' : 'Rotate'} · Right-drag: Pan · Scroll: Zoom
      </div>
    </div>
  );
};
