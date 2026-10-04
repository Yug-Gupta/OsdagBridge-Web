/**
 * ViewerCadModel
 *
 * The stable, data-source-agnostic CAD domain model consumed by the Web 3D viewer.
 * All inputs — whether from mock generators, local calculators, or the REST API — are
 * normalised through an adapter (mockCadAdapter / backendCadAdapter) into this interface.
 *
 * Dimensions: millimetres; angles: degrees; unless stated otherwise.
 *
 * Mirrors the geometry data produced by osdagbridge.desktop.ui.cad_3d and
 * osdagbridge.core.bridge_types.plate_girder.cad_generator.
 */

import type {
  FootpathConfig,
  GirderSectionDims,
  GirderSegment,
  ShearStudParams,
  SectionDimsDTO,
  GrillageNodeData,
  GrillageMemberData,
} from './bridgeGeometry';

export type { FootpathConfig };

export interface ViewerCadModel {
  // ── Span & Layout ──────────────────────────────────────────────────────────
  /** Span length L (mm). */
  span_length: number;
  /** Number of longitudinal girders. */
  num_girders: number;
  /** Centre-to-centre girder spacing (mm). */
  girder_spacing: number;
  /** Skew angle in degrees (0 = straight bridge). */
  skew_angle: number;

  // ── Deck ───────────────────────────────────────────────────────────────────
  /** Carriageway width (mm). */
  carriageway_width: number;
  /** Deck slab thickness (mm). */
  deck_thickness: number;
  /** Deck overhang beyond outermost girder centreline (mm). */
  deck_overhang: number;

  // ── Footpath / Footway ─────────────────────────────────────────────────────
  footpath_config: FootpathConfig;
  /** Footpath width (mm). */
  footpath_width: number;
  /** Footpath slab thickness (mm). */
  footpath_thickness: number;

  // ── Railing ────────────────────────────────────────────────────────────────
  /** Railing type key (e.g. "IRC 5 - RCC Railing", "IRC 5 - Steel Railing"). */
  railing_type: string;
  /** Railing post/base width (mm). */
  railing_width: number;
  /** Number of horizontal rails (steel railing only). */
  rail_count: number;

  // ── Crash Barrier ──────────────────────────────────────────────────────────
  /** Barrier type key as matched by irc5Geometry (e.g. "IRC 5 - RCC Crash Barrier"). */
  barrier_type: string;
  /** Barrier subtype (e.g. "Double W-beam", "Single W-beam"). */
  crash_barrier_subtype: string;
  /** Barrier base/kerb width (mm). */
  crash_barrier_width: number;

  // ── Median ─────────────────────────────────────────────────────────────────
  median_enabled: boolean;
  /** Median type key (e.g. "Raised Kerb", "RCC Crash Barrier", "Metallic Crash Barrier"). */
  median_type: string;

  // ── Surfacing ──────────────────────────────────────────────────────────────
  /** Wearing course / surfacing thickness (mm). */
  wearing_course_thickness: number;

  // ── Girder Section ─────────────────────────────────────────────────────────
  /** Plate girder section dimensions (all mm). */
  girder: GirderSectionDims;
  /** Optional variable-depth girder segments. */
  girder_segments?: GirderSegment[];

  // ── Intermediate Stiffeners ────────────────────────────────────────────────
  include_intermediate_stiffeners: boolean;
  /** Centre-to-centre spacing of intermediate stiffeners (mm). */
  intermediate_stiffener_spacing: number;
  /** Stiffener plate thickness (mm). */
  intermediate_stiffener_thickness: number;
  /** Outstand of stiffener from web face (mm). */
  intermediate_stiffener_outstand?: number;

  // ── Bearing / End Stiffeners ───────────────────────────────────────────────
  /** Number of bearing stiffener pairs at each end. */
  num_end_stiffener_pairs: number;
  end_stiffener_thickness: number;
  end_stiffener_outstand?: number;

  // ── Longitudinal Stiffeners ────────────────────────────────────────────────
  include_longitudinal_stiffeners: boolean;
  num_longitudinal_stiffeners: number;
  longitudinal_stiffener_thickness: number;
  longitudinal_stiffener_outstand?: number;

  // ── Shear Studs ────────────────────────────────────────────────────────────
  shear_stud_params: ShearStudParams;

  // ── Cross Bracing ──────────────────────────────────────────────────────────
  /** Cross bracing frame spacing (mm). */
  cross_bracing_spacing: number;
  /** Bracing configuration: X-type or K-type. */
  bracing_type: 'X' | 'K';
  x_bracket_option?: 'BOTH' | 'TOP' | 'BOTTOM' | 'NONE';
  k_top_bracket?: boolean;

  diagonal_section_type: string;
  diagonal_section_dims: SectionDimsDTO;
  diagonal_thickness: number;

  top_chord_section_type: string;
  top_chord_section_dims: SectionDimsDTO;
  top_chord_thickness: number;

  bottom_chord_section_type: string;
  bottom_chord_section_dims: SectionDimsDTO;
  bottom_chord_thickness: number;

  // ── End Diaphragm ──────────────────────────────────────────────────────────
  /** End diaphragm type (e.g. "Cross Bracing", "Full Plate"). */
  end_diaphragm_type: string;
  end_diaphragm_bracing_type: string;

  // ── Materials ──────────────────────────────────────────────────────────────
  steel_grade: string;
  concrete_grade: string;

  // ── Grillage Overlay (optional) ────────────────────────────────────────────
  /** Node dictionary keyed by node id — used for Grillage View overlay. */
  nodes?: Record<number, GrillageNodeData>;
  /** Member dictionary keyed by member id. */
  members?: Record<number, GrillageMemberData>;
}
