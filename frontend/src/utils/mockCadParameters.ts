import type { BridgeCadParameters, FootpathConfig } from '../types/bridgeGeometry';
import { getCarriagewayWidth, getNoOfGirders, getSpan, INPUT_KEYS } from './bridgeInputs';

/**
 * Mock builder for the 3D CAD parameters.
 *
 * This is a STOP-GAP for when the backend endpoint
 * (GET/POST /api/v1/cad/3d-parameters) is not yet available. It only assembles
 * user-provided layout values; it deliberately does NOT size structural
 * members (that is the engine's job). Section dimensions fall back to neutral
 * placeholders until the backend returns the design's real values.
 */

type Dict = Record<string, any> | undefined;

function readNum(source: Dict, key: string, fallback: number): number {
  const raw = source?.[key];
  const v = Number(raw);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

function readStr(source: Dict, key: string, fallback: string): string {
  const raw = source?.[key];
  return typeof raw === 'string' && raw.trim() ? raw : fallback;
}

function footpathConfig(inputs: Record<string, any>): FootpathConfig {
  const v = String(inputs[INPUT_KEYS.footpath] ?? '').toLowerCase();
  if (v.includes('both')) return 'BOTH';
  if (v.includes('single')) return 'LEFT';
  return 'NONE';
}

export function buildMockCadParameters(
  inputs: Record<string, any>,
  additionalInputs: Record<string, any> = {},
): BridgeCadParameters {
  const ai = additionalInputs;
  const span = getSpan(inputs) * 1000; // m -> mm
  const numGirders = getNoOfGirders(inputs, ai);
  const carriageway = getCarriagewayWidth(inputs) * 1000; // m -> mm

  const girderSpacing = readNum(
    ai,
    'typical_section.girder_spacing',
    carriageway / 1000 / Math.max(1, numGirders - 1),
  ) * 1000; // m -> mm

  const girderD = readNum(ai, 'member_properties.girder_details.section_input.depth', 1500);
  const girderBf = readNum(ai, 'member_properties.girder_details.section_input.top_flange_width', 400);
  const girderBfB = readNum(ai, 'member_properties.girder_details.section_input.bottom_flange_width', 400);
  const girderTf = readNum(ai, 'member_properties.girder_details.section_input.top_flange_thickness', 25);
  const girderTfB = readNum(ai, 'member_properties.girder_details.section_input.bottom_flange_thickness', 25);
  const girderTw = readNum(ai, 'member_properties.girder_details.section_input.web_thickness', 12);

  return {
    span_length: span,
    num_girders: numGirders,
    girder_spacing: girderSpacing,
    skew_angle: Number(inputs[INPUT_KEYS.skewAngle]) || 0,

    carriageway_width: carriageway,
    deck_thickness: readNum(ai, 'typical_section.deck_thickness', 200),
    deck_overhang: readNum(ai, 'typical_section.deck_overhang', 1.0) * 1000,

    footpath_config: footpathConfig(inputs),
    footpath_width: readNum(ai, 'typical_section.footpath_width', 1.5) * 1000,
    footpath_thickness: readNum(ai, 'typical_section.footpath_thickness', 200),

    railing_type: readStr(ai, 'typical_section.railing.type', 'IRC 5 - RCC Railing'),
    railing_width: readNum(ai, 'typical_section.railing.width', 0.375) * 1000,
    rail_count: readNum(ai, 'typical_section.railing.rail_count', 3),

    barrier_type: readStr(ai, 'typical_section.crash_barrier.type', 'IRC 5 - RCC Crash Barrier'),
    crash_barrier_width: readNum(ai, 'typical_section.crash_barrier.width', 0.45) * 1000,

    median_enabled: String(inputs[INPUT_KEYS.includeMedian] ?? '').toLowerCase() === 'yes',
    median_type: readStr(ai, 'typical_section.median.type', 'IRC 5 - Raised Kerb'),

    wearing_course_thickness: readNum(ai, 'typical_section.wearing_course.thickness', 75),

    cross_bracing_spacing: readNum(ai, 'member_properties.stiffener_details.intermediate_stiffener_spacing', 3500),
    bracing_type: readStr(ai, 'member_properties.cross_bracing_details.bracing_type', 'X'),

    end_diaphragm_type: readStr(ai, 'member_properties.end_diaphragm_details.type', 'Cross Bracing'),

    girder: {
      d: girderD,
      bf: girderBf,
      bf_b: girderBfB,
      tf: girderTf,
      tf_b: girderTfB,
      tw: girderTw,
    },

    intermediate_stiffener_enabled:
      String(ai['member_properties.stiffener_details.intermediate_stiffener'] ?? '').toLowerCase() !== 'no',
    intermediate_stiffener_spacing: readNum(
      ai,
      'member_properties.stiffener_details.intermediate_stiffener_spacing',
      1800,
    ),
    end_stiffener_pairs: readNum(
      ai,
      'member_properties.stiffener_details.no_bearing_stiffeners_each_end',
      2,
    ),

    steel_grade: readStr(inputs, INPUT_KEYS.girder, 'E 250'),
    concrete_grade: readStr(inputs, INPUT_KEYS.deck, 'M 40'),
  };
}
