import type { ViewerCadModel } from '../types/viewerCadModel';
import { buildMockCadParameters } from '../utils/mockCadParameters';

/**
 * Mock CAD Adapter
 *
 * Normalizes local mock parameters or UI inputs into the stable ViewerCadModel.
 * This adapter can be swapped out or disabled when real backend payloads are hooked up.
 */
export function mapMockCadToViewerModel(
  inputs: Record<string, any>,
  additionalInputs: Record<string, any> = {},
): ViewerCadModel {
  const rawMock = buildMockCadParameters(inputs, additionalInputs);
  return {
    ...rawMock,
  };
}
