/**
 * irc5Geometry.ts
 * Geometry specifications for IRC 5 standard bridge elements:
 *   - CrashBarrierGeometry
 *   - RailingGeometry
 *   - MedianGeometry
 * Mirrors osdagbridge.desktop.cad.irc5_geometry
 */

export interface RCCBarrierGeometry {
  type: 'rcc';
  total_height: number;
  top_width: number;
  bottom_width: number;
  base_vertical: number;
  mid_offset: number;
}

export interface MetallicBarrierGeometry {
  type: 'metallic';
  w_beams: number;
  post_height: number;
  kerb_height: number;
}

export type CrashBarrierGeo = RCCBarrierGeometry | MetallicBarrierGeometry;

export class CrashBarrierGeometry {
  static get_geometry(barrierType: string): CrashBarrierGeo | null {
    if (barrierType === 'IRC 5 - High Containment RCC Crash Barrier') {
      return {
        type: 'rcc',
        total_height: 1550.0,
        top_width: 250.0,
        bottom_width: 525.0,
        base_vertical: 100.0,
        mid_offset: 350.0,
      };
    }
    if (barrierType === 'IRC 5 - RCC Crash Barrier' || barrierType === 'Custom') {
      return {
        type: 'rcc',
        total_height: 900.0,
        top_width: 175.0,
        bottom_width: 450.0,
        base_vertical: 100.0,
        mid_offset: 350.0,
      };
    }
    if (barrierType === 'IRC 5 - Metallic Crash Barrier with Single W-Beam') {
      return {
        type: 'metallic',
        w_beams: 1,
        post_height: 950.0,
        kerb_height: 150.0,
      };
    }
    if (barrierType === 'IRC 5 - Metallic Crash Barrier with Double W-Beam') {
      return {
        type: 'metallic',
        w_beams: 2,
        post_height: 950.0,
        kerb_height: 150.0,
      };
    }
    // Default fallback
    return {
      type: 'rcc',
      total_height: 900.0,
      top_width: 175.0,
      bottom_width: 450.0,
      base_vertical: 100.0,
      mid_offset: 350.0,
    };
  }
}

export interface RCCRailingGeometry {
  type: 'rcc';
  height: number;
  width: number;
  post_spacing: number;
}

export interface SteelRailingGeometry {
  type: 'steel';
  height: number;
  width: number;
  post_dia: number;
  rail_count: number;
  post_spacing: number;
}

export type RailingGeo = RCCRailingGeometry | SteelRailingGeometry;

export class RailingGeometry {
  static get_geometry(railingType: string | null | undefined): RailingGeo | null {
    if (railingType === 'IRC 5 - Steel Railing') {
      return {
        type: 'steel',
        height: 1100,
        width: 375,
        post_dia: 100,
        rail_count: 3,
        post_spacing: 2000,
      };
    }
    // Default to RCC Railing
    return {
      type: 'rcc',
      height: 1100,
      width: 375,
      post_spacing: 2000,
    };
  }
}

export interface KerbMedianGeometry {
  type: 'kerb';
  median_width: number;
  kerb_height: number;
  kerb_top_width: number;
  kerb_bottom_width: number;
}

export interface RCCMedianGeometry {
  type: 'rcc_barrier';
  median_width: number;
  barrier_height: number;
  top_width: number;
  bottom_width: number;
}

export interface MetallicMedianGeometry {
  type: 'metallic';
  median_width: number;
  post_height: number;
  w_beams: number;
}

export type MedianGeo = KerbMedianGeometry | RCCMedianGeometry | MetallicMedianGeometry;

export class MedianGeometry {
  static get_geometry(medianType: string | null | undefined): MedianGeo | null {
    if (medianType === 'IRC 5 - RCC Crash Barrier') {
      return {
        type: 'rcc_barrier',
        median_width: 1200,
        barrier_height: 900,
        top_width: 175,
        bottom_width: 450,
      };
    }
    if (medianType === 'IRC 5 - Metallic Crash Barrier with Single W-Beam') {
      return {
        type: 'metallic',
        median_width: 1200,
        post_height: 950,
        w_beams: 1,
      };
    }
    if (medianType === 'IRC 5 - Metallic Crash Barrier with Double W-Beam') {
      return {
        type: 'metallic',
        median_width: 1200,
        post_height: 950,
        w_beams: 2,
      };
    }
    // Default to Raised Kerb
    return {
      type: 'kerb',
      median_width: 1200,
      kerb_height: 225,
      kerb_top_width: 1150,
      kerb_bottom_width: 1200,
    };
  }
}
