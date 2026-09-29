/**
 * 3D CAD parameter contract for the web viewer.
 *
 * Mirrors the subset of osdagbridge.core.bridge_types.plate_girder.dto.
 * BridgeParametersDTO (and the model_data produced by cad_generator.py) that is
 * needed to draw the bridge. All lengths are in millimetres and angles in
 * degrees, matching the desktop DTO.
 *
 * This shape is what the backend should return from the 3D-CAD parameters
 * endpoint. Until that endpoint exists the frontend builds a mock instance
 * from the user inputs (see utils/mockCadParameters.ts). No design calculation
 * is performed here — section sizes are expected to come from the engine.
 */

export interface GirderSectionDims {
  /** Girder total depth (mm). */
  d: number;
  /** Top flange width (mm). */
  bf: number;
  /** Bottom flange width (mm). */
  bf_b: number;
  /** Top flange thickness (mm). */
  tf: number;
  /** Bottom flange thickness (mm). */
  tf_b: number;
  /** Web thickness (mm). */
  tw: number;
}

export type FootpathConfig = 'NONE' | 'LEFT' | 'RIGHT' | 'BOTH';

export interface BridgeCadParameters {
  /** Span (mm). */
  span_length: number;
  /** Number of longitudinal girders. */
  num_girders: number;
  /** Centre-to-centre girder spacing (mm). */
  girder_spacing: number;
  /** Skew angle (degrees). */
  skew_angle: number;

  /** Carriageway width (mm). */
  carriageway_width: number;
  /** Deck slab thickness (mm). */
  deck_thickness: number;
  /** Deck overhang from outermost girder to deck edge (mm). */
  deck_overhang: number;

  footpath_config: FootpathConfig;
  /** Footpath width (mm). */
  footpath_width: number;
  /** Footpath slab thickness (mm). */
  footpath_thickness: number;

  /** Railing type key (matches IRC 5 strings in irc5Geometry.ts). */
  railing_type: string;
  /** Railing width (mm). */
  railing_width: number;
  /** Number of horizontal rails (steel railing). */
  rail_count: number;

  /** Crash barrier type key (matches IRC 5 strings in irc5Geometry.ts). */
  barrier_type: string;
  /** Crash barrier base/kerb width (mm). */
  crash_barrier_width: number;

  median_enabled: boolean;
  /** Median type key (matches IRC 5 strings in irc5Geometry.ts). */
  median_type: string;

  /** Wearing course / surfacing thickness (mm). */
  wearing_course_thickness: number;

  /** Cross-bracing centre spacing (mm). */
  cross_bracing_spacing: number;
  /** Cross-bracing type: "X" or "K". */
  bracing_type: string;

  /** End diaphragm type (e.g. "Cross Bracing", "Rolled Beam", "Welded Beam"). */
  end_diaphragm_type: string;

  /** Girder section dimensions (mm). */
  girder: GirderSectionDims;

  /** Intermediate stiffener spacing (mm) and whether they are drawn. */
  intermediate_stiffener_enabled: boolean;
  intermediate_stiffener_spacing: number;
  /** Number of bearing (end) stiffener pairs at each support. */
  end_stiffener_pairs: number;

  steel_grade: string;
  concrete_grade: string;
}
