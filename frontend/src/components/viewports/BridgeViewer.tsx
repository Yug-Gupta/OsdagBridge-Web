import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { CadDisplayState } from '../../store/useBridgeStore';
import type { BridgeCadParameters } from '../../types/bridgeGeometry';
import { CrashBarrierGeometry, MedianGeometry, RailingGeometry } from '../../utils/irc5Geometry';

/**
 * Web 3D bridge viewer — React Three Fiber port of
 * osdagbridge.desktop.ui.cad_3d.CAD3DWindow / _render_model_body.
 *
 * Geometry driven by BridgeCadParameters (web mirror of BridgeParametersDTO).
 * All dimensions in millimetres → converted to metres via MM = 0.001.
 *
 * Desktop component colours (from cad_3d.py _render_model_body):
 *   WEB_COLOR      (47,47,35)     → #2f2f23
 *   FLANGE_COLOR   (134,134,100)  → #868664
 *   STIFFENER_COLOR(72,72,54)     → #484836
 *   DECK_COLOR     (100,100,100)  → #646464
 *   BARRIER_COLOR  (40,40,40)     → #282828
 *   BRACING_COLOR  (60,60,60)     → #3c3c3c
 *   SUPPORT_COLOR  (20,20,20)     → #141414
 */

/**
 * Web 3D bridge viewer.
 *
 * The geometry is driven entirely by BridgeCadParameters (see
 * types/bridgeGeometry.ts), the web mirror of the desktop
 * BridgeParametersDTO / cad_generator.py output. IRC 5 barrier/median/railing
 * cross-sections come from utils/irc5Geometry.ts, which ports
 * osdagbridge.desktop.cad.irc5_geometry. No structural sizing happens here.
 */

const GIRDER_COLOR = '#8fb31a';
const STIFFENER_COLOR = '#7d9a17';
const DECK_COLOR = '#9aa3ad';
const WEARING_COLOR = '#2f3540';
const BARRIER_COLOR = '#6b7280';
const MEDIAN_COLOR = '#8a8f98';
const RAILING_COLOR = '#5f6672';
const ABUTMENT_COLOR = '#78716c';
const DIAPHRAGM_COLOR = '#6f8f14';
const BRACING_COLOR = '#7f9c19';
const MM = 0.001;

function IBeamGirder({ x, length, p }: { x: number; length: number; p: BridgeCadParameters }) {
  const d = p.girder.d * MM;
  const tf = p.girder.tf * MM;
  const tfB = p.girder.tf_b * MM;
  const tw = p.girder.tw * MM;
  const bf = p.girder.bf * MM;
  const bfB = p.girder.bf_b * MM;
  const webH = Math.max(0.01, d - tf - tfB);

  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, tfB + webH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[tw, webH, length]} />
        <meshStandardMaterial color={GIRDER_COLOR} metalness={0.55} roughness={0.38} />
      </mesh>
      <mesh position={[0, d - tf / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[bf, tf, length]} />
        <meshStandardMaterial color={GIRDER_COLOR} metalness={0.55} roughness={0.38} />
      </mesh>
      <mesh position={[0, tfB / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[bfB, tfB, length]} />
        <meshStandardMaterial color={GIRDER_COLOR} metalness={0.55} roughness={0.38} />
      </mesh>
    </group>
  );
}

function Diagonal({
  from,
  to,
  color = BRACING_COLOR,
  thickness = 0.05,
}: {
  from: [number, number];
  to: [number, number];
  color?: string;
  thickness?: number;
}) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2;
  return (
    <mesh position={[mx, my, 0]} rotation={[0, 0, angle]} castShadow>
      <boxGeometry args={[len, thickness, thickness]} />
      <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
    </mesh>
  );
}

function CrossBracing({
  girderXs,
  length,
  spacing,
  yTop,
  yBottom,
}: {
  girderXs: number[];
  length: number;
  spacing: number;
  yTop: number;
  yBottom: number;
}) {
  const stations = useMemo(() => {
    const step = Math.max(1, spacing);
    const count = Math.max(1, Math.floor(length / step));
    const start = -length / 2;
    return Array.from({ length: count }, (_, i) => start + (i + 0.5) * (length / count));
  }, [length, spacing]);

  return (
    <group>
      {stations.map((z) =>
        girderXs.slice(0, -1).map((x0, i) => {
          const x1 = girderXs[i + 1];
          return (
            <group key={`${z}-${i}`} position={[0, 0, z]}>
              <Diagonal from={[x0, yTop]} to={[x1, yBottom]} />
              <Diagonal from={[x0, yBottom]} to={[x1, yTop]} />
            </group>
          );
        }),
      )}
    </group>
  );
}

function CrashBarrier({ x, length, type, onDeckY }: { x: number; length: number; type: string; onDeckY: number }) {
  const geo = CrashBarrierGeometry.get_geometry(type);
  if (!geo) return null;

  if (geo.type === 'rcc') {
    const h = geo.total_height * MM;
    const topW = geo.top_width * MM;
    const botW = geo.bottom_width * MM;
    const baseH = h * 0.6;
    const topH = h * 0.4;
    return (
      <group position={[x, onDeckY, 0]}>
        <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[botW, baseH, length]} />
          <meshStandardMaterial color={BARRIER_COLOR} roughness={0.75} metalness={0.05} />
        </mesh>
        <mesh position={[0, baseH + topH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[topW, topH, length]} />
          <meshStandardMaterial color={BARRIER_COLOR} roughness={0.75} metalness={0.05} />
        </mesh>
      </group>
    );
  }

  // Metallic W-beam barrier: kerb + posts + horizontal beam(s).
  const postH = geo.post_height * MM;
  const kerbH = geo.kerb_height * MM;
  const postSpacing = 2.0;
  const nPosts = Math.max(2, Math.round(length / postSpacing));
  return (
    <group position={[x, onDeckY, 0]}>
      <mesh position={[0, kerbH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, kerbH, length]} />
        <meshStandardMaterial color={ABUTMENT_COLOR} roughness={0.9} />
      </mesh>
      {Array.from({ length: nPosts }, (_, i) => (
        <mesh key={i} position={[0, kerbH + postH / 2, -length / 2 + (i + 0.5) * (length / nPosts)]} castShadow>
          <boxGeometry args={[0.08, postH, 0.08]} />
          <meshStandardMaterial color={BARRIER_COLOR} metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
      {Array.from({ length: geo.w_beams }, (_, i) => (
        <mesh key={`w${i}`} position={[0, kerbH + postH * (0.55 + i * 0.3), 0]} castShadow>
          <boxGeometry args={[0.12, 0.28, length]} />
          <meshStandardMaterial color={BARRIER_COLOR} metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function MedianBarrier({ length, type, onDeckY }: { length: number; type: string; onDeckY: number }) {
  const geo = MedianGeometry.get_geometry(type);
  if (!geo) return null;

  if (geo.type === 'kerb') {
    const h = geo.kerb_height * MM;
    return (
      <mesh position={[0, onDeckY + h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[geo.kerb_bottom_width * MM, h, length]} />
        <meshStandardMaterial color={MEDIAN_COLOR} roughness={0.85} />
      </mesh>
    );
  }
  if (geo.type === 'rcc_barrier') {
    const h = geo.barrier_height * MM;
    const baseH = h * 0.6;
    const topH = h * 0.4;
    return (
      <group position={[0, onDeckY, 0]}>
        <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[geo.bottom_width * MM, baseH, length]} />
          <meshStandardMaterial color={MEDIAN_COLOR} roughness={0.8} />
        </mesh>
        <mesh position={[0, baseH + topH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[geo.top_width * MM, topH, length]} />
          <meshStandardMaterial color={MEDIAN_COLOR} roughness={0.8} />
        </mesh>
      </group>
    );
  }
  // metallic
  const postH = geo.post_height * MM;
  const nPosts = Math.max(2, Math.round(length / 2.0));
  return (
    <group position={[0, onDeckY, 0]}>
      {Array.from({ length: nPosts }, (_, i) => (
        <mesh key={i} position={[0, postH / 2, -length / 2 + (i + 0.5) * (length / nPosts)]} castShadow>
          <boxGeometry args={[0.08, postH, 0.08]} />
          <meshStandardMaterial color={MEDIAN_COLOR} metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
      {Array.from({ length: geo.w_beams }, (_, i) => (
        <mesh key={`w${i}`} position={[0, postH * (0.55 + i * 0.3), 0]} castShadow>
          <boxGeometry args={[0.12, 0.28, length]} />
          <meshStandardMaterial color={MEDIAN_COLOR} metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Railing({ x, length, type, onDeckY }: { x: number; length: number; type: string; onDeckY: number }) {
  const geo = RailingGeometry.get_geometry(type);
  if (!geo) return null;
  const h = geo.height * MM;
  const w = geo.width * MM;
  const postSpacing = (geo.post_spacing || 2000) * MM;

  if (geo.type === 'steel') {
    const nPosts = Math.max(2, Math.round(length / postSpacing));
    return (
      <group position={[x, onDeckY, 0]}>
        {Array.from({ length: nPosts }, (_, i) => (
          <mesh key={i} position={[0, h / 2, -length / 2 + (i + 0.5) * (length / nPosts)]} castShadow>
            <boxGeometry args={[geo.post_dia * MM, h, geo.post_dia * MM]} />
            <meshStandardMaterial color={RAILING_COLOR} metalness={0.5} roughness={0.45} />
          </mesh>
        ))}
        {Array.from({ length: geo.rail_count }, (_, i) => (
          <mesh key={`r${i}`} position={[0, h * (0.35 + i * 0.3), 0]} castShadow>
            <boxGeometry args={[0.06, 0.06, length]} />
            <meshStandardMaterial color={RAILING_COLOR} metalness={0.5} roughness={0.45} />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group position={[x, onDeckY, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, length]} />
        <meshStandardMaterial color={RAILING_COLOR} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Abutment({ z, width }: { z: number; width: number }) {
  return (
    <mesh position={[0, -1.05, z]} receiveShadow castShadow>
      <boxGeometry args={[Math.max(width + 1.2, 6), 2.1, 0.85]} />
      <meshStandardMaterial color={ABUTMENT_COLOR} roughness={0.88} metalness={0.04} />
    </mesh>
  );
}

function BridgeModel({
  params,
  showDeck,
  cadDisplay,
}: {
  params: BridgeCadParameters;
  showDeck: boolean;
  cadDisplay: CadDisplayState;
}) {
  const L = params.span_length * MM;
  const deckT = params.deck_thickness * MM;
  const wcT = params.wearing_course_thickness * MM;
  const girderD = params.girder.d * MM;
  const tf = params.girder.tf * MM;
  const tfB = params.girder.tf_b * MM;
  const n = Math.max(2, Math.round(params.num_girders));
  const spacing = params.girder_spacing * MM;
  const carriageway = params.carriageway_width * MM;
  const footpathCount =
    params.footpath_config === 'BOTH' ? 2 : params.footpath_config === 'NONE' ? 0 : 1;
  const footpathW = (params.footpath_width * MM) * footpathCount;
  const totalWidth = carriageway + footpathW;

  const girderXs = useMemo(
    () => Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * spacing),
    [n, spacing],
  );

  const deckTopY = girderD + deckT;
  const barrierW = params.crash_barrier_width * MM;
  const edgeX = totalWidth / 2 - barrierW / 2;
  const railingX = totalWidth / 2 - (params.railing_width * MM) / 2;
  const skewRad = (params.skew_angle * Math.PI) / 180;

  return (
    <group position={[0, -girderD, 0]} rotation={[0, -skewRad, 0]}>
      {girderXs.map((x, i) => (
        <IBeamGirder key={i} x={x} length={L} p={params} />
      ))}

      {cadDisplay.supports && (
        <group>
          <Abutment z={L / 2 + 0.5} width={totalWidth} />
          <Abutment z={-(L / 2 + 0.5)} width={totalWidth} />
        </group>
      )}

      <CrossBracing
        girderXs={girderXs}
        length={L}
        spacing={params.cross_bracing_spacing * MM}
        yTop={girderD - tf / 2}
        yBottom={tfB / 2}
      />

      {/* End diaphragms across the girder group at both supports */}
      {[-1, 1].map((s) => (
        <mesh key={`dia-${s}`} position={[0, girderD / 2, s * (L / 2 - 0.15)]} castShadow>
          <boxGeometry args={[Math.max(0.2, girderXs[girderXs.length - 1] - girderXs[0]), 0.14, 0.14]} />
          <meshStandardMaterial color={DIAPHRAGM_COLOR} metalness={0.45} roughness={0.4} />
        </mesh>
      ))}

      {showDeck && (
        <group>
          {/* Deck slab */}
          <mesh position={[0, girderD + deckT / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[totalWidth, deckT, L]} />
            <meshStandardMaterial color={DECK_COLOR} roughness={0.82} metalness={0.04} />
          </mesh>
          {/* Wearing course */}
          {wcT > 0 && (
            <mesh position={[0, deckTopY + wcT / 2, 0]} receiveShadow>
              <boxGeometry args={[Math.max(0.4, totalWidth - 0.05), wcT, L]} />
              <meshStandardMaterial color={WEARING_COLOR} roughness={0.92} metalness={0} />
            </mesh>
          )}
          {/* Crash barriers */}
          <CrashBarrier x={-edgeX} length={L} type={params.barrier_type} onDeckY={deckTopY} />
          <CrashBarrier x={edgeX} length={L} type={params.barrier_type} onDeckY={deckTopY} />
          {/* Median */}
          {params.median_enabled && (
            <MedianBarrier length={L} type={params.median_type} onDeckY={deckTopY} />
          )}
          {/* Railings (outer edges when footpaths exist) */}
          {params.footpath_config !== 'NONE' && (
            <>
              <Railing x={-railingX} length={L} type={params.railing_type} onDeckY={deckTopY} />
              {params.footpath_config === 'BOTH' && (
                <Railing x={railingX} length={L} type={params.railing_type} onDeckY={deckTopY} />
              )}
            </>
          )}
        </group>
      )}
    </group>
  );
}

interface BridgeViewerProps {
  params: BridgeCadParameters;
  showDeck: boolean;
  darkMode?: boolean;
  cadDisplay?: CadDisplayState;
  cadZoom?: number;
  activeNavTool?: 'rotate' | 'pan';
}

const DEFAULT_CAD_DISPLAY: CadDisplayState = {
  nodes: false,
  nodeNumbers: false,
  elementNumbers: false,
  grillageView: false,
  axis: true,
  legend: false,
  gridLines: true,
  supports: true,
  loads: false,
  girderLabels: false,
};

export const BridgeViewer: React.FC<BridgeViewerProps> = ({
  params,
  showDeck,
  darkMode = true,
  cadDisplay = DEFAULT_CAD_DISPLAY,
  cadZoom = 1,
  activeNavTool = 'rotate',
}) => {
  const cellColor = darkMode ? '#334155' : '#d1d5db';
  const sectionColor = darkMode ? '#64748b' : '#9ca3af';

  const L = params.span_length * MM;
  const n = Math.max(2, Math.round(params.num_girders));
  const spacing = params.girder_spacing * MM;
  const girderXs = useMemo(
    () => Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * spacing),
    [n, spacing],
  );

  const camDist = Math.max(10, L * 0.9);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%', background: 'transparent', touchAction: 'none' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
    >
      <PerspectiveCamera
        makeDefault
        position={[camDist * 0.6, camDist * 0.45, camDist * 0.75]}
        fov={42}
        near={0.1}
        far={500}
      />

      <ambientLight intensity={darkMode ? 0.28 : 0.42} />
      <hemisphereLight args={[darkMode ? '#94a3b8' : '#e2e8f0', darkMode ? '#0f172a' : '#64748b', 0.45]} />
      <directionalLight
        position={[12, 16, 10]}
        intensity={darkMode ? 1.05 : 1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-6, 8, -8]} intensity={0.28} />

      <OrbitControls
        makeDefault
        enableRotate
        enablePan
        enableZoom
        enableDamping
        dampingFactor={0.12}
        minDistance={3}
        maxDistance={120}
        maxPolarAngle={Math.PI / 2 + 0.2}
        screenSpacePanning
        mouseButtons={{
          LEFT: activeNavTool === 'pan' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />

      <group scale={cadZoom}>
        <BridgeModel params={params} showDeck={showDeck} cadDisplay={cadDisplay} />

        {cadDisplay.girderLabels &&
          girderXs.map((x, i) => (
            <Html key={`gl-${i}`} position={[x, 2.1, -L / 2 - 0.4]} center distanceFactor={18}>
              <span
                style={{
                  color: '#ffffff',
                  background: '#90af13',
                  borderRadius: '3px',
                  padding: '1px 5px',
                  fontSize: '11px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                G{i + 1}
              </span>
            </Html>
          ))}

        {cadDisplay.loads && (
          <group>
            {[-1, 1].map((side) => (
              <mesh
                key={`load-${side}`}
                position={[side * (params.carriageway_width * MM) * 0.22, 2.6, 0]}
                rotation={[Math.PI, 0, 0]}
                castShadow
              >
                <coneGeometry args={[0.18, 0.55, 12]} />
                <meshStandardMaterial color="#e11d48" />
              </mesh>
            ))}
          </group>
        )}
      </group>

      {cadDisplay.axis && <axesHelper args={[3]} position={[0, -2.1, 0]} />}

      {cadDisplay.gridLines && (
        <Grid
          infiniteGrid
          cellSize={1}
          sectionSize={5}
          cellColor={cellColor}
          sectionColor={sectionColor}
          fadeDistance={Math.max(36, L * 1.5)}
          position={[0, -2.1, 0]}
        />
      )}
    </Canvas>
  );
};
