import axios from 'axios';
import { UIFieldSchema, ValidateFieldResponse } from '../types/schema';
import type { BridgeCadParameters } from '../types/bridgeGeometry';
import { buildMockCadParameters } from '../utils/mockCadParameters';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export let isBackendAvailable = false;

export interface SteelMaterial {
  name: string;
  fy?: number;
  fu?: number;
  E?: number;
}

export interface ConcreteMaterial {
  grade: string;
  fck?: number;
  Ecm?: number;
}

export interface RolledSection {
  designation: string;
  type?: string;
}

// Steel grades exactly as stored in Steel_Grade_Properties table (IS 2062:2011)
const MOCK_STEEL: SteelMaterial[] = [
  { name: 'E 250A',  fy: 250, fu: 410, E: 200000 },
  { name: 'E 250B0', fy: 250, fu: 410, E: 200000 },
  { name: 'E 250BR', fy: 250, fu: 410, E: 200000 },
  { name: 'E 250C',  fy: 250, fu: 410, E: 200000 },
  { name: 'E 275A',  fy: 275, fu: 430, E: 200000 },
  { name: 'E 275B0', fy: 275, fu: 430, E: 200000 },
  { name: 'E 275BR', fy: 275, fu: 430, E: 200000 },
  { name: 'E 275C',  fy: 275, fu: 430, E: 200000 },
  { name: 'E 300A',  fy: 300, fu: 440, E: 200000 },
  { name: 'E 300B0', fy: 300, fu: 440, E: 200000 },
  { name: 'E 300BR', fy: 300, fu: 440, E: 200000 },
  { name: 'E 300C',  fy: 300, fu: 440, E: 200000 },
  { name: 'E 350A',  fy: 350, fu: 490, E: 200000 },
  { name: 'E 350B0', fy: 350, fu: 490, E: 200000 },
  { name: 'E 350BR', fy: 350, fu: 490, E: 200000 },
  { name: 'E 350C',  fy: 350, fu: 490, E: 200000 },
  { name: 'E 410A',  fy: 410, fu: 540, E: 200000 },
  { name: 'E 410B0', fy: 410, fu: 540, E: 200000 },
  { name: 'E 410BR', fy: 410, fu: 540, E: 200000 },
  { name: 'E 410C',  fy: 410, fu: 540, E: 200000 },
  { name: 'E 450A',  fy: 450, fu: 570, E: 200000 },
  { name: 'E 450BR', fy: 450, fu: 570, E: 200000 },
  { name: 'E 550A',  fy: 550, fu: 650, E: 200000 },
  { name: 'E 550BR', fy: 550, fu: 650, E: 200000 },
  { name: 'E 600A',  fy: 600, fu: 700, E: 200000 },
  { name: 'E 600BR', fy: 600, fu: 700, E: 200000 },
  { name: 'E 650A',  fy: 650, fu: 750, E: 200000 },
  { name: 'E 650BR', fy: 650, fu: 750, E: 200000 },
];

// Concrete grades exactly as stored in Concrete_Grade_Properties table
const MOCK_CONCRETE: ConcreteMaterial[] = [
  { grade: 'M15', fck: 15, Ecm: 27000 },
  { grade: 'M20', fck: 20, Ecm: 29000 },
  { grade: 'M25', fck: 25, Ecm: 30000 },
  { grade: 'M30', fck: 30, Ecm: 31000 },
  { grade: 'M35', fck: 35, Ecm: 32000 },
  { grade: 'M40', fck: 40, Ecm: 33000 },
  { grade: 'M45', fck: 45, Ecm: 34000 },
  { grade: 'M50', fck: 50, Ecm: 35000 },
  { grade: 'M55', fck: 55, Ecm: 36000 },
  { grade: 'M60', fck: 60, Ecm: 37000 },
  { grade: 'M65', fck: 65, Ecm: 38000 },
  { grade: 'M70', fck: 70, Ecm: 39000 },
  { grade: 'M75', fck: 75, Ecm: 40000 },
  { grade: 'M80', fck: 80, Ecm: 41000 },
  { grade: 'M85', fck: 85, Ecm: 42000 },
  { grade: 'M90', fck: 90, Ecm: 43000 },
];


// Rolled/fabricated beam sections from Beams table (IS 808 + Euronorm)
const MOCK_ROLLED: RolledSection[] = [
  // JB — Junior Beams
  { designation: 'JB 150', type: 'beam' },
  { designation: 'JB 175', type: 'beam' },
  { designation: 'JB 200', type: 'beam' },
  { designation: 'JB 225', type: 'beam' },
  // LB — Light Beams (IS 808)
  { designation: 'LB 75',  type: 'beam' },
  { designation: 'LB 100', type: 'beam' },
  { designation: 'LB 125', type: 'beam' },
  { designation: 'LB 150', type: 'beam' },
  { designation: 'LB 175', type: 'beam' },
  { designation: 'LB 200', type: 'beam' },
  { designation: 'LB 225', type: 'beam' },
  { designation: 'LB 250', type: 'beam' },
  { designation: 'LB 275', type: 'beam' },
  { designation: 'LB 300', type: 'beam' },
  { designation: 'LB 325', type: 'beam' },
  { designation: 'LB 350', type: 'beam' },
  { designation: 'LB 400', type: 'beam' },
  { designation: 'LB 450', type: 'beam' },
  { designation: 'LB 500', type: 'beam' },
  { designation: 'LB 550', type: 'beam' },
  { designation: 'LB 600', type: 'beam' },
  // MB — Medium Beams (IS 808)
  { designation: 'MB 100', type: 'beam' },
  { designation: 'MB 125', type: 'beam' },
  { designation: 'MB 150', type: 'beam' },
  { designation: 'MB 175', type: 'beam' },
  { designation: 'MB 200', type: 'beam' },
  { designation: 'MB 225', type: 'beam' },
  { designation: 'MB 250', type: 'beam' },
  { designation: 'MB 300', type: 'beam' },
  { designation: 'MB 350', type: 'beam' },
  { designation: 'MB 400', type: 'beam' },
  { designation: 'MB 450', type: 'beam' },
  { designation: 'MB 500', type: 'beam' },
  { designation: 'MB 550', type: 'beam' },
  { designation: 'MB 600', type: 'beam' },
  // WB — Wide Flange Beams (IS 808)
  { designation: 'WB 150', type: 'beam' },
  { designation: 'WB 175', type: 'beam' },
  { designation: 'WB 200', type: 'beam' },
  { designation: 'WB 225', type: 'beam' },
  { designation: 'WB 250', type: 'beam' },
  { designation: 'WB 300', type: 'beam' },
  { designation: 'WB 350', type: 'beam' },
  { designation: 'WB 400', type: 'beam' },
  { designation: 'WB 450', type: 'beam' },
  { designation: 'WB 500', type: 'beam' },
  { designation: 'WB 550', type: 'beam' },
  { designation: 'WB 600', type: 'beam' },
];

async function loadMockSchema(): Promise<UIFieldSchema[]> {
  const fallback = await fetch('/mock-schema.json');
  if (!fallback.ok) {
    throw new Error('Failed to load mock-schema.json');
  }
  return normalizeSchemaPayload(await fallback.json());
}

function isSchemaField(value: unknown): value is UIFieldSchema {
  if (!value || typeof value !== 'object') return false;
  const field = value as Record<string, unknown>;
  return typeof field.key === 'string'
    && typeof field.label === 'string'
    && typeof field.ui_type === 'string';
}

/** Accept both a raw field array and wrapped `{ fields | schema | basic }` payloads. */
export function normalizeSchemaPayload(data: unknown): UIFieldSchema[] {
  if (Array.isArray(data)) {
    if (!data.every(isSchemaField)) {
      throw new Error('Schema payload contains an invalid field definition');
    }
    return data;
  }
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['fields', 'schema', 'basic', 'input_fields', 'ui_fields']) {
      if (Array.isArray(obj[key])) {
        return normalizeSchemaPayload(obj[key]);
      }
    }
  }
  throw new Error('Schema payload must be an array of field definitions');
}

function listFromUnknown(data: unknown, keys: string[]): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of keys) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
  }
  return [];
}

/**
 * Fetch the input schema from GET /api/v1/schema.
 * Falls back to mock-schema.json when that endpoint is not ready.
 */
export async function fetchBasicSchema(): Promise<UIFieldSchema[]> {
  try {
    const res = await apiClient.get('/schema');
    const fields = normalizeSchemaPayload(res.data);
    if (fields.length === 0) {
      throw new Error('Empty schema payload');
    }
    isBackendAvailable = true;
    return fields;
  } catch (error) {
    isBackendAvailable = false;
    console.info('Schema API unavailable — using local mock-schema.json', error);
    return loadMockSchema();
  }
}

/**
 * Fetch the Additional Inputs schema from GET /api/v1/schema/additional-inputs.
 * Falls back to the locally extracted mock-madditional-inputs.json (mirrors
 * osdagbridge.core.bridge_types.plate_girder.ui_fields_additional_input).
 */
export async function fetchAdditionalInputsSchema(): Promise<unknown> {
  try {
    const res = await apiClient.get('/schema/additional-inputs');
    if (Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
    throw new Error('Empty additional-inputs schema payload');
  } catch (error) {
    console.info('Additional Inputs schema API unavailable — using local mock', error);
    const fallback = await fetch('/mock-additional-inputs.json');
    if (!fallback.ok) {
      throw new Error('Failed to load mock-additional-inputs.json');
    }
    return fallback.json();
  }
}

/**
 * Fetch the 3D CAD parameters for the viewer.
 *
 * Expected backend contract:
 *   POST /api/v1/cad/3d-parameters  { inputs, additional_inputs }
 *   -> BridgeCadParameters (see types/bridgeGeometry.ts)
 *
 * The endpoint should wrap osdagbridge.core get_3d_cad_parameters() so the
 * frontend never sizes members itself. Until it exists, a mock is built from
 * the current inputs so the viewer stays functional.
 */
export async function fetch3dCadParameters(
  inputs: Record<string, any>,
  additionalInputs: Record<string, any>,
): Promise<BridgeCadParameters> {
  try {
    const res = await apiClient.post<BridgeCadParameters>('/cad/3d-parameters', {
      inputs,
      additional_inputs: additionalInputs,
    });
    if (res.data && typeof res.data === 'object' && 'span_length' in res.data) {
      return res.data;
    }
    throw new Error('Invalid 3D CAD parameters payload');
  } catch (error) {
    console.info('3D CAD parameters API unavailable — using local mock', error);
    return buildMockCadParameters(inputs, additionalInputs);
  }
}

/**
 * Result-dialog display schemas (Steel Details / Transverse / Deck summary).
 * Mirrors osdagbridge.core.bridge_types.plate_girder.ui_fields_additional_input.
 * Falls back to the extracted mock so the dialogs stay usable offline.
 */
export interface ResultSchemas {
  steelDesignDetails: unknown;
  transverseMemberDesign: unknown;
  deckDesignSummary: unknown;
}

let resultSchemaCache: ResultSchemas | null = null;

export async function fetchResultSchemas(): Promise<ResultSchemas> {
  if (resultSchemaCache) return resultSchemaCache;
  try {
    const res = await apiClient.get<ResultSchemas>('/schema/result-dialogs');
    if (res.data && typeof res.data === 'object' && 'steelDesignDetails' in res.data) {
      resultSchemaCache = res.data;
      return res.data;
    }
    throw new Error('Empty result schema payload');
  } catch (error) {
    console.info('Result schema API unavailable — using local mock', error);
    const fallback = await fetch('/mock-result-schemas.json');
    if (!fallback.ok) throw new Error('Failed to load mock-result-schemas.json');
    resultSchemaCache = (await fallback.json()) as ResultSchemas;
    return resultSchemaCache;
  }
}

/**
 * POST /api/v1/validate — live field validation when the backend is ready.
 */
export async function validateInputs(payload: {
  key: string;
  value: unknown;
  all_inputs: Record<string, unknown>;
}): Promise<ValidateFieldResponse | null> {
  if (!isBackendAvailable) return null;

  const tryPost = async (path: string) => {
    const res = await apiClient.post<ValidateFieldResponse>(path, payload);
    return res.data;
  };

  try {
    return await tryPost('/validate');
  } catch (error) {
    console.warn('Input validation API unavailable; using client-side validation.', error);
    return null;
  }
}

export async function fetchSteelMaterials(): Promise<SteelMaterial[]> {
  try {
    const res = await apiClient.get('/materials/steel');
    const rows = listFromUnknown(res.data, ['items', 'materials', 'steel', 'grades']);
    const mapped = rows
      .map((row) => {
        if (typeof row === 'string') return { name: row };
        if (row && typeof row === 'object') {
          const r = row as Record<string, unknown>;
          const name = String(r.name ?? r.grade ?? r.designation ?? '');
          if (!name) return null;
          return {
            name,
            fy: typeof r.fy === 'number' ? r.fy : typeof r.Fy === 'number' ? r.Fy : undefined,
            fu: typeof r.fu === 'number' ? r.fu : typeof r.Fu === 'number' ? r.Fu : undefined,
            E: typeof r.E === 'number' ? r.E : undefined,
          } as SteelMaterial;
        }
        return null;
      })
      .filter((m): m is SteelMaterial => Boolean(m));
    if (mapped.length > 0) return mapped;
  } catch {
    // placeholder catalog
  }
  return MOCK_STEEL;
}

export async function fetchConcreteMaterials(): Promise<ConcreteMaterial[]> {
  try {
    const res = await apiClient.get('/materials/concrete');
    const rows = listFromUnknown(res.data, ['items', 'materials', 'concrete', 'grades']);
    const mapped = rows
      .map((row) => {
        if (typeof row === 'string') return { grade: row };
        if (row && typeof row === 'object') {
          const r = row as Record<string, unknown>;
          const grade = String(r.grade ?? r.name ?? '');
          if (!grade) return null;
          return {
            grade,
            fck: typeof r.fck === 'number' ? r.fck : undefined,
            Ecm: typeof r.Ecm === 'number' ? r.Ecm : typeof r.Ec === 'number' ? r.Ec : undefined,
          } as ConcreteMaterial;
        }
        return null;
      })
      .filter((m): m is ConcreteMaterial => Boolean(m));
    if (mapped.length > 0) return mapped;
  } catch {
    // placeholder catalog
  }
  return MOCK_CONCRETE;
}

export async function fetchRolledSections(): Promise<RolledSection[]> {
  try {
    const res = await apiClient.get('/sections/rolled');
    const rows = listFromUnknown(res.data, ['items', 'sections', 'rolled']);
    const mapped = rows
      .map((row) => {
        if (typeof row === 'string') return { designation: row };
        if (row && typeof row === 'object') {
          const r = row as Record<string, unknown>;
          const designation = String(r.designation ?? r.name ?? r.section ?? '');
          if (!designation) return null;
          return {
            designation,
            type: typeof r.type === 'string' ? r.type : undefined,
          } as RolledSection;
        }
        return null;
      })
      .filter((s): s is RolledSection => Boolean(s));
    if (mapped.length > 0) return mapped;
  } catch {
    // placeholder catalog
  }
  return MOCK_ROLLED;
}
