import type {
  BridgeCadParameters,
  FootpathConfig,
  GrillageMemberData,
  GrillageNodeData,
} from '../types/bridgeGeometry';
import { getCarriagewayWidth, getNoOfGirders, getSpan, INPUT_KEYS } from './bridgeInputs';

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
  if (v.includes('single') || v.includes('left')) return 'LEFT';
  if (v.includes('right')) return 'RIGHT';
  return 'NONE';
}

/**
 * Builds realistic grillage nodes and members for overlay visualization
 * (Grillage View, Nodes, Node Numbers, Element Numbers) matching desktop results_data._build_nodes_members().
 */
function buildMockGrillage(
  spanL: number,
  numGirders: number,
  girderSpacing: number,
  crossBracingSpacing: number,
  skewAngleDeg: number,
  deckTopZ: number,
  deckThickness: number,
): { nodes: Record<number, GrillageNodeData>; members: Record<number, GrillageMemberData> } {
  const nodes: Record<number, GrillageNodeData> = {};
  const members: Record<number, GrillageMemberData> = {};

  const skewRad = (skewAngleDeg * Math.PI) / 180;
  const skewTan = Math.tan(skewRad);

  // Stations along the span (cross bracing frames and support ends)
  const nPanels = Math.max(2, Math.round(spanL / Math.max(1000, crossBracingSpacing)));
  const stationSpacing = spanL / nPanels;
  const xStations: number[] = [];
  for (let i = 0; i <= nPanels; i++) {
    xStations.push(i * stationSpacing);
  }

  const totalWidth = (numGirders - 1) * girderSpacing;
  let nodeId = 1;
  const gridNodeMap: number[][] = []; // [stationIdx][girderIdx] -> nodeId

  const zM = deckTopZ / 1000; // in metres

  for (let sIdx = 0; sIdx < xStations.length; sIdx++) {
    const rawX = xStations[sIdx];
    gridNodeMap[sIdx] = [];

    for (let gIdx = 0; gIdx < numGirders; gIdx++) {
      const yOffsetMm = gIdx * girderSpacing - totalWidth / 2;
      const xSkewOffsetMm = yOffsetMm * skewTan;
      const xMm = rawX + xSkewOffsetMm;

      const xM = xMm / 1000;
      const yM = yOffsetMm / 1000;

      const currentId = nodeId++;
      nodes[currentId] = {
        id: currentId,
        x: Number(xM.toFixed(3)),
        y: Number(yM.toFixed(3)),
        z: Number(zM.toFixed(3)),
        label: `Node ${currentId}\nX: ${xM.toFixed(2)} m\nZ: ${yM.toFixed(2)} m`,
      };
      gridNodeMap[sIdx][gIdx] = currentId;
    }
  }

  let memberId = 1;

  // Longitudinal members along girders
  for (let gIdx = 0; gIdx < numGirders; gIdx++) {
    for (let sIdx = 0; sIdx < xStations.length - 1; sIdx++) {
      const n1 = gridNodeMap[sIdx][gIdx];
      const n2 = gridNodeMap[sIdx + 1][gIdx];
      const currentId = memberId++;
      members[currentId] = {
        id: currentId,
        node1: n1,
        node2: n2,
        type: 'longitudinal',
      };
    }
  }

  // Transverse members between girders at each station
  for (let sIdx = 0; sIdx < xStations.length; sIdx++) {
    for (let gIdx = 0; gIdx < numGirders - 1; gIdx++) {
      const n1 = gridNodeMap[sIdx][gIdx];
      const n2 = gridNodeMap[sIdx + 1 ? sIdx : sIdx][gIdx + 1];
      const currentId = memberId++;
      members[currentId] = {
        id: currentId,
        node1: n1,
        node2: n2,
        type: 'transverse',
      };
    }
  }

  return { nodes, members };
}

export function buildMockCadParameters(
  inputs: Record<string, any>,
  additionalInputs: Record<string, any> = {},
): BridgeCadParameters {
  const ai = additionalInputs;
  const span = getSpan(inputs) * 1000; // m -> mm
  const numGirders = Math.max(2, getNoOfGirders(inputs, ai));
  const carriageway = getCarriagewayWidth(inputs) * 1000; // m -> mm
  const skewAngle = Number(inputs[INPUT_KEYS.skewAngle]) || 0;

  const defaultGirderSpacing = carriageway / Math.max(1, numGirders - 1);
  const girderSpacing = readNum(
    ai,
    'typical_section.girder_spacing',
    defaultGirderSpacing / 1000,
  ) * 1000;

  const girderD = readNum(ai, 'member_properties.girder_details.section_input.depth', 1500);
  const girderBf = readNum(ai, 'member_properties.girder_details.section_input.top_flange_width', 450);
  const girderBfB = readNum(ai, 'member_properties.girder_details.section_input.bottom_flange_width', 450);
  const girderTf = readNum(ai, 'member_properties.girder_details.section_input.top_flange_thickness', 25);
  const girderTfB = readNum(ai, 'member_properties.girder_details.section_input.bottom_flange_thickness', 25);
  const girderTw = readNum(ai, 'member_properties.girder_details.section_input.web_thickness', 14);

  const deckThickness = readNum(ai, 'typical_section.deck_thickness', 250);
  const deckOverhang = readNum(ai, 'typical_section.deck_overhang', 1.0) * 1000;
  const footpathConf = footpathConfig(inputs);
  const footpathWidth = readNum(ai, 'typical_section.footpath_width', 1.5) * 1000;
  const footpathThickness = readNum(ai, 'typical_section.footpath_thickness', 250);

  const crossBracingSpacing = readNum(
    ai,
    'member_properties.cross_bracing_details.spacing',
    readNum(ai, 'member_properties.stiffener_details.intermediate_stiffener_spacing', 3500),
  );

  const rawBracingType = readStr(ai, 'member_properties.cross_bracing_details.bracing_type', 'X').toUpperCase();
  const bracingType: 'X' | 'K' = rawBracingType.includes('K') ? 'K' : 'X';

  const deckTopZ = girderD + girderTf + deckThickness;

  const { nodes, members } = buildMockGrillage(
    span,
    numGirders,
    girderSpacing,
    crossBracingSpacing,
    skewAngle,
    deckTopZ,
    deckThickness,
  );

  return {
    span_length: span,
    num_girders: numGirders,
    girder_spacing: girderSpacing,
    skew_angle: skewAngle,

    carriageway_width: carriageway,
    deck_thickness: deckThickness,
    deck_overhang: deckOverhang,

    footpath_config: footpathConf,
    footpath_width: footpathWidth,
    footpath_thickness: footpathThickness,

    railing_type: readStr(ai, 'typical_section.railing.type', 'IRC 5 - RCC Railing'),
    railing_width: readNum(ai, 'typical_section.railing.width', 0.3) * 1000,
    rail_count: readNum(ai, 'typical_section.railing.rail_count', 3),

    barrier_type: readStr(ai, 'typical_section.crash_barrier.type', 'Semi-Rigid'),
    crash_barrier_subtype: readStr(ai, 'typical_section.crash_barrier.subtype', 'Double W-beam'),
    crash_barrier_width: readNum(ai, 'typical_section.crash_barrier.width', 0.45) * 1000,

    median_enabled:
      String(inputs[INPUT_KEYS.includeMedian] ?? '').toLowerCase() === 'yes' ||
      String(ai['typical_section.median.enabled'] ?? '').toLowerCase() === 'yes',
    median_type: readStr(ai, 'typical_section.median.type', 'Metallic Crash Barrier'),

    wearing_course_thickness: readNum(ai, 'typical_section.wearing_course.thickness', 75),

    girder: {
      d: girderD,
      bf: girderBf,
      bf_b: girderBfB,
      tf: girderTf,
      tf_b: girderTfB,
      tw: girderTw,
    },

    include_intermediate_stiffeners:
      String(ai['member_properties.stiffener_details.intermediate_stiffener'] ?? 'yes').toLowerCase() !== 'no',
    intermediate_stiffener_spacing: readNum(
      ai,
      'member_properties.stiffener_details.intermediate_stiffener_spacing',
      1800,
    ),
    intermediate_stiffener_thickness: readNum(
      ai,
      'member_properties.stiffener_details.intermediate_stiffener_thickness',
      16,
    ),
    intermediate_stiffener_outstand: readNum(
      ai,
      'member_properties.stiffener_details.intermediate_stiffener_outstand',
      150,
    ),

    num_end_stiffener_pairs: readNum(
      ai,
      'member_properties.stiffener_details.no_bearing_stiffeners_each_end',
      3,
    ),
    end_stiffener_thickness: readNum(
      ai,
      'member_properties.stiffener_details.end_stiffener_thickness',
      25,
    ),
    end_stiffener_outstand: readNum(
      ai,
      'member_properties.stiffener_details.end_stiffener_outstand',
      160,
    ),

    include_longitudinal_stiffeners:
      String(ai['member_properties.stiffener_details.include_longitudinal'] ?? 'yes').toLowerCase() === 'yes' ||
      girderD >= 1800,
    num_longitudinal_stiffeners: readNum(
      ai,
      'member_properties.stiffener_details.num_longitudinal_stiffeners',
      2,
    ),
    longitudinal_stiffener_thickness: readNum(
      ai,
      'member_properties.stiffener_details.longitudinal_stiffener_thickness',
      16,
    ),
    longitudinal_stiffener_outstand: 120,

    shear_stud_params: {
      base_diameter: readNum(ai, 'member_properties.shear_studs.base_diameter', 25),
      top_diameter: readNum(ai, 'member_properties.shear_studs.top_diameter', 35),
      base_height: readNum(ai, 'member_properties.shear_studs.base_height', 100),
      top_height: readNum(ai, 'member_properties.shear_studs.top_height', 25),
      num_per_section: readNum(ai, 'member_properties.shear_studs.num_per_section', 3),
      transverse_spacing: readNum(ai, 'member_properties.shear_studs.transverse_spacing', 120),
      pitch: readNum(ai, 'member_properties.shear_studs.pitch', 300),
    },

    cross_bracing_spacing: crossBracingSpacing,
    bracing_type: bracingType,
    x_bracket_option: 'BOTH',
    k_top_bracket: true,

    diagonal_section_type: readStr(ai, 'member_properties.cross_bracing_details.diagonal_section_type', 'ANGLE'),
    diagonal_section_dims: { leg_h: 100, leg_w: 75, connection_type: 'LONGER_LEG' },
    diagonal_thickness: readNum(ai, 'member_properties.cross_bracing_details.diagonal_thickness', 8),

    top_chord_section_type: readStr(ai, 'member_properties.cross_bracing_details.top_chord_section_type', 'DOUBLE_CHANNEL'),
    top_chord_section_dims: { leg_h: 100, leg_w: 50, connection_type: 'LONGER_LEG' },
    top_chord_thickness: readNum(ai, 'member_properties.cross_bracing_details.top_chord_thickness', 8),

    bottom_chord_section_type: readStr(ai, 'member_properties.cross_bracing_details.bottom_chord_section_type', 'ANGLE'),
    bottom_chord_section_dims: { leg_h: 90, leg_w: 60, connection_type: 'LONGER_LEG' },
    bottom_chord_thickness: readNum(ai, 'member_properties.cross_bracing_details.bottom_chord_thickness', 8),

    end_diaphragm_type: readStr(ai, 'member_properties.end_diaphragm_details.type', 'Cross Bracing'),
    end_diaphragm_bracing_type: 'K',

    steel_grade: readStr(inputs, INPUT_KEYS.girder, 'E 350'),
    concrete_grade: readStr(inputs, INPUT_KEYS.deck, 'M 40'),

    nodes,
    members,
  };
}
