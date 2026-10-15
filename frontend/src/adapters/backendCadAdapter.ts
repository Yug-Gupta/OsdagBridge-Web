import type { ViewerCadModel } from '../types/viewerCadModel';

/**
 * Backend CAD Adapter
 *
 * Normalizes raw backend API responses into the stable ViewerCadModel
 * consumed by the 3D CAD viewer.
 */
export function mapBackendCadToViewerModel(payload: any): ViewerCadModel {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid backend CAD response: payload is not an object');
  }

  return {
    span_length: Number(payload.span_length ?? 24000),
    num_girders: Number(payload.num_girders ?? 4),
    girder_spacing: Number(payload.girder_spacing ?? 2500),
    skew_angle: Number(payload.skew_angle ?? 0),
    carriageway_width: Number(payload.carriageway_width ?? 7500),
    deck_thickness: Number(payload.deck_thickness ?? 250),
    deck_overhang: Number(payload.deck_overhang ?? 1250),

    footpath_config: payload.footpath_config ?? 'NONE',
    footpath_width: Number(payload.footpath_width ?? 1500),
    footpath_thickness: Number(payload.footpath_thickness ?? 250),

    railing_type: payload.railing_type ?? 'IRC 5 - Steel Railing',
    railing_width: Number(payload.railing_width ?? 150),
    rail_count: Number(payload.rail_count ?? 3),

    barrier_type: payload.barrier_type ?? 'IRC 5 - Rigid RCC',
    crash_barrier_subtype: payload.crash_barrier_subtype ?? 'Type 1',
    crash_barrier_width: Number(payload.crash_barrier_width ?? 500),

    median_enabled: Boolean(payload.median_enabled),
    median_type: payload.median_type ?? 'IRC 5 - Raised Median',

    wearing_course_thickness: Number(payload.wearing_course_thickness ?? 65),

    girder: {
      d: Number(payload.girder?.d ?? 1600),
      bf: Number(payload.girder?.bf ?? 450),
      bf_b: Number(payload.girder?.bf_b ?? 550),
      tf: Number(payload.girder?.tf ?? 32),
      tf_b: Number(payload.girder?.tf_b ?? 40),
      tw: Number(payload.girder?.tw ?? 14),
    },
    girder_segments: payload.girder_segments,

    include_intermediate_stiffeners: Boolean(payload.include_intermediate_stiffeners ?? true),
    intermediate_stiffener_spacing: Number(payload.intermediate_stiffener_spacing ?? 2000),
    intermediate_stiffener_thickness: Number(payload.intermediate_stiffener_thickness ?? 12),
    intermediate_stiffener_outstand: Number(payload.intermediate_stiffener_outstand ?? 120),

    num_end_stiffener_pairs: Number(payload.num_end_stiffener_pairs ?? 2),
    end_stiffener_thickness: Number(payload.end_stiffener_thickness ?? 16),
    end_stiffener_outstand: Number(payload.end_stiffener_outstand ?? 140),

    include_longitudinal_stiffeners: Boolean(payload.include_longitudinal_stiffeners ?? false),
    num_longitudinal_stiffeners: Number(payload.num_longitudinal_stiffeners ?? 1),
    longitudinal_stiffener_thickness: Number(payload.longitudinal_stiffener_thickness ?? 12),
    longitudinal_stiffener_outstand: Number(payload.longitudinal_stiffener_outstand ?? 100),

    shear_stud_params: payload.shear_stud_params ?? {
      base_diameter: 25,
      top_diameter: 35,
      base_height: 100,
      top_height: 10,
      num_per_section: 3,
      transverse_spacing: 120,
      pitch: 250,
    },

    cross_bracing_spacing: Number(payload.cross_bracing_spacing ?? 4000),
    bracing_type: payload.bracing_type ?? 'K',
    x_bracket_option: payload.x_bracket_option ?? 'BOTH',
    k_top_bracket: Boolean(payload.k_top_bracket ?? true),

    diagonal_section_type: payload.diagonal_section_type ?? 'ISA 100x100x10',
    diagonal_section_dims: payload.diagonal_section_dims ?? { leg_h: 100, leg_w: 100 },
    diagonal_thickness: Number(payload.diagonal_thickness ?? 10),

    top_chord_section_type: payload.top_chord_section_type ?? 'ISA 90x90x8',
    top_chord_section_dims: payload.top_chord_section_dims ?? { leg_h: 90, leg_w: 90 },
    top_chord_thickness: Number(payload.top_chord_thickness ?? 8),

    bottom_chord_section_type: payload.bottom_chord_section_type ?? 'ISA 90x90x8',
    bottom_chord_section_dims: payload.bottom_chord_section_dims ?? { leg_h: 90, leg_w: 90 },
    bottom_chord_thickness: Number(payload.bottom_chord_thickness ?? 8),

    end_diaphragm_type: payload.end_diaphragm_type ?? 'Braced',
    end_diaphragm_bracing_type: payload.end_diaphragm_bracing_type ?? 'K',

    steel_grade: payload.steel_grade ?? 'E 250',
    concrete_grade: payload.concrete_grade ?? 'M35',

    nodes: payload.nodes,
    members: payload.members,
  };
}
