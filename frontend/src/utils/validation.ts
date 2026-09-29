/**
 * Desktop-faithful input validation engine for OsdagBridge.
 *
 * Implements the validation rules from:
 * - osdagbridge.core.bridge_types.plate_girder.validator (BridgeInputValidator)
 * - osdagbridge.core.utils.osi_validator (OsiInputValidator)
 * - osdagbridge.desktop.ui.template_page (validate_required_inputs)
 * - osdagbridge.desktop.ui.dialogs.project_location (validate_custom_weather_data)
 * - osdagbridge.desktop.ui.dialogs.material_properties (_validate_and_save, _on_material_field_edited)
 */

import { BackendValidationResponse } from '../types/schema';

// ── Constants from osdagbridge.core.utils.common & keyfile ──────────────────────
export const SPAN_MIN = 20.0;
export const SPAN_MAX = 45.0;
export const CARRIAGEWAY_WIDTH_MIN = 4.25;
export const CARRIAGEWAY_WIDTH_MIN_WITH_MEDIAN = 7.5;
export const CARRIAGEWAY_WIDTH_MAX_LIMIT = 23.6;
export const SKEW_ANGLE_MIN = -15.0;
export const SKEW_ANGLE_MAX = 15.0;

export interface ValidationResult {
  valid: boolean;
  corrected?: any;
  message?: string;
}

export interface OsiValidationOutcome {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  correctedValues: Record<string, any>;
  errorText: (limit?: number) => string;
}

function toFloat(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
}

function toInt(val: unknown): number | null {
  const f = toFloat(val);
  return f !== null ? Math.trunc(f) : null;
}

/**
 * Validate basic inputs (mirrors BridgeInputValidator.validate_basic_inputs).
 * Returns { valid: true } or { valid: false, corrected, message }.
 */
export function validateBasicInput(
  key: string,
  value: unknown,
  inputs: Record<string, any>
): ValidationResult {
  // ── Span (Software Scope Limit) ─────────────────────────────────────────────
  if (key === 'geometry.span' || key === 'span') {
    const span = toFloat(value);
    if (span === null) {
      return { valid: false, corrected: SPAN_MIN, message: 'Span must be a numeric value.' };
    }
    if (span < SPAN_MIN) {
      return {
        valid: false,
        corrected: SPAN_MIN,
        message: `Span must be between ${SPAN_MIN} m and ${SPAN_MAX} m (software limitation).`,
      };
    }
    if (span > SPAN_MAX) {
      return {
        valid: false,
        corrected: SPAN_MAX,
        message: `Span must be between ${SPAN_MIN} m and ${SPAN_MAX} m (software limitation).`,
      };
    }
    return { valid: true };
  }

  // ── Carriageway Width (IRC 5 Cl.104.3.1) ────────────────────────────────────
  if (key === 'geometry.carriageway_width' || key === 'carriageway_width') {
    const cw = toFloat(value);
    const median = inputs['geometry.include_median'] ?? inputs['include_median'];
    const minW = median === 'Yes' ? CARRIAGEWAY_WIDTH_MIN_WITH_MEDIAN : CARRIAGEWAY_WIDTH_MIN;

    if (cw === null) {
      return { valid: false, corrected: minW, message: 'Carriageway width must be specified.' };
    }

    const assumedLanes = median === 'Yes' ? 2 : 1;
    let requiredWidth = assumedLanes === 2 ? 7.5 : 4.25;
    if (assumedLanes > 2) {
      requiredWidth = 7.5 + 3.5 * (assumedLanes - 2);
    }

    if (cw < requiredWidth) {
      return {
        valid: false,
        corrected: requiredWidth,
        message: `Minimum carriageway width required is ${requiredWidth.toFixed(2)} m as per IRC 5:2015 Clause 104.3.1.`,
      };
    }
    if (cw > CARRIAGEWAY_WIDTH_MAX_LIMIT) {
      return {
        valid: false,
        corrected: CARRIAGEWAY_WIDTH_MAX_LIMIT,
        message: `Carriageway width exceeds ${CARRIAGEWAY_WIDTH_MAX_LIMIT} m (software limitation).`,
      };
    }
    return { valid: true };
  }

  // ── Skew Angle (IRC 24 via keyfile) ────────────────────────────────────────
  if (key === 'geometry.skew_angle' || key === 'skew_angle') {
    if (value === '' || value === null || value === undefined) {
      return { valid: true };
    }
    const angle = toFloat(value);
    if (angle === null) {
      return { valid: false, corrected: SKEW_ANGLE_MIN, message: 'Skew angle must be a numeric value.' };
    }
    if (angle < SKEW_ANGLE_MIN) {
      return {
        valid: false,
        corrected: SKEW_ANGLE_MIN,
        message: `Skew angle must be between ${SKEW_ANGLE_MIN}° and ${SKEW_ANGLE_MAX}°.`,
      };
    }
    if (angle > SKEW_ANGLE_MAX) {
      return {
        valid: false,
        corrected: SKEW_ANGLE_MAX,
        message: `Skew angle must be between ${SKEW_ANGLE_MIN}° and ${SKEW_ANGLE_MAX}°.`,
      };
    }
    return { valid: true };
  }

  return { valid: true };
}

/**
 * Validate custom material properties (mirrors BridgeInputValidator.validate_material_inputs).
 */
export function validateMaterialInput(
  key: string,
  value: unknown,
  memberType: 'Steel' | 'Concrete'
): ValidationResult {
  const v = toFloat(value);
  const cleanKey = key.toLowerCase();

  // Steel members
  if (memberType === 'Steel') {
    if (cleanKey.includes('density')) {
      if (v === null) return { valid: false, corrected: 50.0, message: 'Weight Density must be a numeric value.' };
      if (v < 50.0) return { valid: false, corrected: 50.0, message: 'Weight Density must be between 50.0 and 120.0 kN/m³.' };
      if (v > 120.0) return { valid: false, corrected: 120.0, message: 'Weight Density must be between 50.0 and 120.0 kN/m³.' };
    } else if (cleanKey === 'fy') {
      if (v === null) return { valid: false, corrected: 100.0, message: 'Yield Strength, Fy must be a numeric value.' };
      if (v < 100.0) return { valid: false, corrected: 100.0, message: 'Yield Strength, Fy must be between 100.0 and 1200.0 MPa.' };
      if (v > 1200.0) return { valid: false, corrected: 1200.0, message: 'Yield Strength, Fy must be between 100.0 and 1200.0 MPa.' };
    } else if (cleanKey === 'fu') {
      if (v === null) return { valid: false, corrected: 100.0, message: 'Ultimate Tensile Strength, Fu must be a numeric value.' };
      if (v < 100.0) return { valid: false, corrected: 100.0, message: 'Ultimate Tensile Strength, Fu must be between 100.0 and 1500.0 MPa.' };
      if (v > 1500.0) return { valid: false, corrected: 1500.0, message: 'Ultimate Tensile Strength, Fu must be between 100.0 and 1500.0 MPa.' };
    } else if (cleanKey === 'e') {
      if (v === null) return { valid: false, corrected: 100.0, message: 'Modulus of Elasticity, E must be a numeric value.' };
      if (v < 100.0) return { valid: false, corrected: 100.0, message: 'Modulus of Elasticity, E must be between 100.0 and 300.0 GPa.' };
      if (v > 300.0) return { valid: false, corrected: 300.0, message: 'Modulus of Elasticity, E must be between 100.0 and 300.0 GPa.' };
    } else if (cleanKey === 'g') {
      if (v === null) return { valid: false, corrected: 30.0, message: 'Modulus of Rigidity, G must be a numeric value.' };
      if (v < 30.0) return { valid: false, corrected: 30.0, message: 'Modulus of Rigidity, G must be between 30.0 and 120.0 GPa.' };
      if (v > 120.0) return { valid: false, corrected: 120.0, message: 'Modulus of Rigidity, G must be between 30.0 and 120.0 GPa.' };
    } else if (cleanKey.includes('poisson')) {
      if (v === null) return { valid: false, corrected: 0.0, message: "Poisson's Ratio must be a numeric value." };
      if (v < 0.0) return { valid: false, corrected: 0.0, message: "Poisson's Ratio must be between 0.0 and 0.5." };
      if (v >= 0.5) return { valid: false, corrected: 0.49, message: "Poisson's Ratio must be between 0.0 and 0.5." };
    } else if (cleanKey.includes('thermal')) {
      if (v === null) return { valid: false, corrected: 1.0, message: 'Thermal Expansion Coefficient must be a numeric value.' };
      if (v < 1.0) return { valid: false, corrected: 1.0, message: 'Thermal Expansion Coefficient must be between 1.0 and 30.0 (×10⁻⁶/°C).' };
      if (v > 30.0) return { valid: false, corrected: 30.0, message: 'Thermal Expansion Coefficient must be between 1.0 and 30.0 (×10⁻⁶/°C).' };
    }
  }

  // Concrete deck
  if (memberType === 'Concrete') {
    if (cleanKey.includes('density')) {
      if (v === null) return { valid: false, corrected: 18.0, message: 'Weight Density must be a numeric value.' };
      if (v < 18.0) return { valid: false, corrected: 18.0, message: 'Weight Density must be between 18.0 and 28.0 kN/m³.' };
      if (v > 28.0) return { valid: false, corrected: 28.0, message: 'Weight Density must be between 18.0 and 28.0 kN/m³.' };
    } else if (cleanKey === 'fck') {
      if (v === null) return { valid: false, corrected: 10.0, message: 'Characteristic Compressive Strength, fck must be a numeric value.' };
      if (v < 10.0) return { valid: false, corrected: 10.0, message: 'Characteristic Compressive Strength, fck must be between 10.0 and 80.0 MPa.' };
      if (v > 80.0) return { valid: false, corrected: 80.0, message: 'Characteristic Compressive Strength, fck must be between 10.0 and 80.0 MPa.' };
    } else if (cleanKey === 'fctm') {
      if (v === null) return { valid: false, corrected: 1.0, message: 'Mean Tensile Strength, fctm must be a numeric value.' };
      if (v < 1.0) return { valid: false, corrected: 1.0, message: 'Mean Tensile Strength, fctm must be between 1.0 and 10.0 MPa.' };
      if (v > 10.0) return { valid: false, corrected: 10.0, message: 'Mean Tensile Strength, fctm must be between 1.0 and 10.0 MPa.' };
    } else if (cleanKey === 'ecm') {
      if (v === null) return { valid: false, corrected: 20.0, message: 'Secant Modulus of Elasticity, Ecm must be a numeric value.' };
      if (v < 20.0) return { valid: false, corrected: 20.0, message: 'Secant Modulus of Elasticity, Ecm must be between 20.0 and 50.0 GPa.' };
      if (v > 50.0) return { valid: false, corrected: 50.0, message: 'Secant Modulus of Elasticity, Ecm must be between 20.0 and 50.0 GPa.' };
    } else if (cleanKey.includes('thermal')) {
      if (v === null) return { valid: false, corrected: 1.0, message: 'Thermal Expansion Coefficient must be a numeric value.' };
      if (v < 1.0) return { valid: false, corrected: 1.0, message: 'Thermal Expansion Coefficient must be between 1.0 and 30.0 (×10⁻⁶/°C).' };
      if (v > 30.0) return { valid: false, corrected: 30.0, message: 'Thermal Expansion Coefficient must be between 1.0 and 30.0 (×10⁻⁶/°C).' };
    }
  }

  return { valid: true };
}

/**
 * Validate custom weather data (mirrors ProjectLocationDialog.validate_custom_weather_data).
 */
export function validateCustomWeatherData(
  wind: unknown,
  zone: unknown,
  maxTemp: unknown,
  minTemp: unknown
): { isValid: boolean; message: string } {
  if (!wind || !maxTemp || !minTemp || !zone || zone === 'Select Zone') {
    return {
      isValid: false,
      message: 'Please fill in all fields (Wind Speed, Seismic Zone, Min/Max Temperature).',
    };
  }

  const windVal = toFloat(wind);
  const maxVal = toFloat(maxTemp);
  const minVal = toFloat(minTemp);

  if (windVal === null || maxVal === null || minVal === null) {
    return { isValid: false, message: 'Wind speed and temperature values must be numeric.' };
  }

  if (windVal < 15.0 || windVal > 100.0) {
    return { isValid: false, message: 'Basic Wind Speed must be between 15.0 and 100.0 m/s.' };
  }

  if (minVal < -50.0 || minVal > 40.0) {
    return { isValid: false, message: 'Min Shade Air Temperature must be between -50.0 and 40.0 °C.' };
  }

  if (maxVal < 20.0 || maxVal > 60.0) {
    return { isValid: false, message: 'Max Shade Air Temperature must be between 20.0 and 60.0 °C.' };
  }

  if (maxVal <= minVal) {
    return {
      isValid: false,
      message: `Max temperature (${maxTemp}°C) must be greater than Min temperature (${minTemp}°C).`,
    };
  }

  return { isValid: true, message: '' };
}

/**
 * Flatten nested OSI dictionary into dotted keys (mirrors OsiInputValidator._flatten).
 */
export function flattenOsiDict(data: Record<string, any>, prefix = ''): Record<string, any> {
  const flat: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    const joined = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(flat, flattenOsiDict(v, joined));
    } else {
      flat[joined] = v;
    }
  }
  return flat;
}

/**
 * Validate an OSI input dictionary on load (mirrors osdagbridge.core.utils.osi_validator).
 */
export function validateOsiInputs(data: unknown): OsiValidationOutcome {
  const result: OsiValidationOutcome = {
    isValid: true,
    errors: [],
    warnings: [],
    correctedValues: {},
    errorText: function (limit?: number) {
      const errs = limit !== undefined ? this.errors.slice(0, limit) : this.errors;
      const lines = errs.map((e) => `• ${e}`);
      if (limit !== undefined && this.errors.length > limit) {
        lines.push(`… and ${this.errors.length - limit} more issue(s).`);
      }
      return lines.join('\n');
    },
  };

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    result.isValid = false;
    result.errors.push('File does not contain a valid input dictionary.');
    return result;
  }

  const flat = flattenOsiDict(data as Record<string, any>);

  // A null skew angle means "straight bridge" (0°); normalize so validator does not fail
  if (flat['geometry.skew_angle'] === undefined && flat['skew_angle'] === undefined) {
    flat['geometry.skew_angle'] = 0.0;
  }

  const basicKeys = [
    ['geometry.span', 'span'],
    ['geometry.carriageway_width', 'carriageway_width'],
    ['geometry.skew_angle', 'skew_angle'],
  ];

  for (const [dotKey, shortKey] of basicKeys) {
    const raw = flat[dotKey] ?? flat[shortKey];
    if (raw === undefined || raw === null || raw === '') {
      continue;
    }
    const val = validateBasicInput(dotKey, raw, flat);
    if (!val.valid) {
      result.errors.push(`${dotKey}: ${val.message}`);
      result.correctedValues[dotKey] = val.corrected;
    }
  }

  result.isValid = result.errors.length === 0;
  return result;
}

/**
 * Standardized adapter ready to consume backend validation responses later.
 */
export function consumeBackendValidation(
  response: BackendValidationResponse
): { isValid: boolean; fieldErrors: Record<string, string>; message?: string } {
  const isValid = Boolean(
    response.is_valid ?? response.valid ?? response.status ?? (response.errors ? Object.keys(response.errors).length === 0 : true)
  );

  const fieldErrors: Record<string, string> = {};
  if (response.errors) {
    if (Array.isArray(response.errors)) {
      response.errors.forEach((err, idx) => {
        fieldErrors[`error_${idx}`] = String(err);
      });
    } else {
      Object.assign(fieldErrors, response.errors);
    }
  }

  return {
    isValid,
    fieldErrors,
    message: response.message,
  };
}
