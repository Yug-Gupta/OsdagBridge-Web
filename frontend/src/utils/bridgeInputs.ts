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

const SPAN_DEFAULT = 30;
const WIDTH_DEFAULT = 7.5;
const GIRDERS_DEFAULT = 4;

export function getSpan(inputs: Inputs): number {
  const v = Number(inputs[INPUT_KEYS.span]);
  return Number.isFinite(v) && v > 0 ? v : SPAN_DEFAULT;
}

export function getCarriagewayWidth(inputs: Inputs): number {
  const v = Number(inputs[INPUT_KEYS.carriagewayWidth]);
  return Number.isFinite(v) && v > 0 ? v : WIDTH_DEFAULT;
}

export function getNoOfGirders(inputs: Inputs, additionalInputs?: AdditionalInputs): number {
  const fromAdditional = Number(additionalInputs?.[INPUT_KEYS.noOfGirders]);
  if (Number.isFinite(fromAdditional) && fromAdditional > 0) return fromAdditional;
  const v = Number(inputs[INPUT_KEYS.noOfGirders]);
  return Number.isFinite(v) && v > 0 ? v : GIRDERS_DEFAULT;
}

export function getGirderMaterial(inputs: Inputs): string {
  return String(inputs[INPUT_KEYS.girder] ?? '');
}

export function getDeckMaterial(inputs: Inputs): string {
  return String(inputs[INPUT_KEYS.deck] ?? '');
}
