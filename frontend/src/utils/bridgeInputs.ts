/**
 * Canonical OsdagBridge input keys and accessors.
 *
 * These string keys are the web mirror of the desktop KEY_* constants in
 * osdagbridge.core.utils.common (e.g. KEY_SPAN = "geometry.span"). Keeping them
 * in one place lets every component read inputs without hardcoding strings, so
 * the same values flow to the shared core engine through the backend.
 */

export const INPUT_KEYS = {
  module: 'module.plate_girder',
  structureType: 'structure.type',
  span: 'geometry.span',
  carriagewayWidth: 'geometry.carriageway_width',
  includeMedian: 'geometry.include_median',
  footpath: 'geometry.footpath',
  skewAngle: 'geometry.skew_angle',
  designMode: 'geometry.design_mode',
  projectLocation: 'project.location',
  girder: 'material.girder',
  crossBracing: 'material.cross_bracing',
  endDiaphragm: 'material.end_diaphragm',
  deck: 'material.deck',

  // Additional Inputs — Typical Section Details
  noOfGirders: 'typical_section.no_of_girders',
  girderSpacing: 'typical_section.girder_spacing',
  deckOverhang: 'typical_section.deck_overhang',
  overallWidth: 'typical_section.overall_bridge_width',

  // Additional Inputs — Loading (project location populates these)
  windSpeed: 'loading.wind_load.basic_wind_speed',
  seismicZone: 'loading.seismic_load.seismic_zone',
  maxTemp: 'loading.temperature_load.highest_max_temp',
  minTemp: 'loading.temperature_load.lowest_min_temp',
} as const;

type Inputs = Record<string, any>;
type AdditionalInputs = Record<string, any> | undefined;

// ── CAD Fallback Defaults (mirrors desktop cad_cross_section.py / cad_top_view.py params) ──
// These are the values shown in the CAD drawing BEFORE the user enters any basic input.
// They must NOT be shown in input fields as entered values.
export const CAD_DEFAULTS = {
  SPAN_MM: 35000,               // mm — matches desktop self.params['span_length']
  CARRIAGEWAY_WIDTH_MM: 10500,  // mm — matches desktop self.params['carriageway_width']
  NUM_GIRDERS: 4,               // matches desktop self.params['num_girders']
  GIRDER_SPACING_MM: 2750,      // mm — DEFAULT_GIRDER_SPACING from common.py
  DECK_OVERHANG_MM: 1000,       // mm — matches desktop self.params['deck_overhang']
  DECK_THICKNESS_MM: 200,       // mm
  CROSS_BRACING_SPACING_MM: 3500, // mm
} as const;

const SPAN_DEFAULT_M       = CAD_DEFAULTS.SPAN_MM / 1000;
const WIDTH_DEFAULT_M      = CAD_DEFAULTS.CARRIAGEWAY_WIDTH_MM / 1000;
const GIRDERS_DEFAULT      = CAD_DEFAULTS.NUM_GIRDERS;
const GIRDER_SPACING_DEFAULT_M = CAD_DEFAULTS.GIRDER_SPACING_MM / 1000;
const DECK_OVERHANG_DEFAULT_M  = CAD_DEFAULTS.DECK_OVERHANG_MM / 1000;

/** Returns true if the user has explicitly entered a span value (not the fallback). */
export function hasUserSpan(inputs: Inputs): boolean {
  const v = inputs[INPUT_KEYS.span];
  return v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)) && Number(v) > 0;
}

/** Returns span in meters; uses CAD fallback default when input is blank/null. */
export function getSpan(inputs: Inputs): number {
  const v = Number(inputs[INPUT_KEYS.span]);
  return Number.isFinite(v) && v > 0 ? v : SPAN_DEFAULT_M;
}

/** Returns true if the user has explicitly entered a carriageway width. */
export function hasUserCarriagewayWidth(inputs: Inputs): boolean {
  const v = inputs[INPUT_KEYS.carriagewayWidth];
  return v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)) && Number(v) > 0;
}

/** Returns carriageway width in meters; uses CAD fallback default when input is blank/null. */
export function getCarriagewayWidth(inputs: Inputs): number {
  const v = Number(inputs[INPUT_KEYS.carriagewayWidth]);
  return Number.isFinite(v) && v > 0 ? v : WIDTH_DEFAULT_M;
}

/** Returns number of girders; prefers additionalInputs, then CAD fallback default. */
export function getNoOfGirders(inputs: Inputs, additionalInputs?: AdditionalInputs): number {
  const fromAdditional = Number(additionalInputs?.[INPUT_KEYS.noOfGirders]);
  if (Number.isFinite(fromAdditional) && fromAdditional > 0) return fromAdditional;
  const v = Number(inputs[INPUT_KEYS.noOfGirders]);
  return Number.isFinite(v) && v > 0 ? v : GIRDERS_DEFAULT;
}

/**
 * Returns girder spacing in meters.
 * Uses DEFAULT_GIRDER_SPACING fallback (2.75 m) matching desktop cad_top_view.py
 * self.params['girder_spacing'] = 2750.
 * Does NOT derive spacing from carriageway width.
 */
export function getGirderSpacing(inputs: Inputs, additionalInputs?: AdditionalInputs): number {
  const fromAdditional = Number(additionalInputs?.[INPUT_KEYS.girderSpacing]);
  if (Number.isFinite(fromAdditional) && fromAdditional > 0) return fromAdditional;
  const v = Number(inputs[INPUT_KEYS.girderSpacing]);
  return Number.isFinite(v) && v > 0 ? v : GIRDER_SPACING_DEFAULT_M;
}

/** Returns deck overhang in meters; uses CAD fallback default. */
export function getDeckOverhang(inputs: Inputs, additionalInputs?: AdditionalInputs): number {
  const fromAdditional = Number(additionalInputs?.[INPUT_KEYS.deckOverhang]);
  if (Number.isFinite(fromAdditional) && fromAdditional > 0) return fromAdditional;
  return DECK_OVERHANG_DEFAULT_M;
}

export function getGirderMaterial(inputs: Inputs): string {
  return String(inputs[INPUT_KEYS.girder] ?? '');
}

export function getDeckMaterial(inputs: Inputs): string {
  return String(inputs[INPUT_KEYS.deck] ?? '');
}
