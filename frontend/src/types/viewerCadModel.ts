import type { BridgeCadParameters } from './bridgeGeometry';

/**
 * Common CAD Data Model (ViewerCadModel)
 * 
 * Represents the stable, data-source-agnostic CAD domain model consumed by the
 * Web 3D CAD viewer. Regardless of whether data originates from mock generators,
 * local calculators, or future REST APIs, all inputs are mapped through an adapter
 * to this standard ViewerCadModel.
 */
export interface ViewerCadModel extends BridgeCadParameters {
  // Domain extensions or additional viewer-specific flags can be defined here
}
