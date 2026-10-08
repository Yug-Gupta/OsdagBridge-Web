import React, { useState, useEffect } from 'react';
import { UIFieldSchema } from '../../types/schema';
import { useBridgeStore } from '../../store/useBridgeStore';
import { validateInputs } from '../../services/api';
import { AlertCircle } from 'lucide-react';


export type FieldRenderer = React.FC<{ field: UIFieldSchema }>;

const fieldRenderers: Record<string, FieldRenderer> = {};

/** Register additional schema `ui_type` renderers without rewriting the form. */
export function registerFieldType(uiType: string, renderer: FieldRenderer) {
  fieldRenderers[uiType] = renderer;
}

const labelStyle: React.CSSProperties = {
  minWidth: '110px',
  maxWidth: '120px',
  fontSize: '12px',
  color: 'var(--text-main)',
  fontWeight: 500,
  lineHeight: 1.25,
};

function FieldLabel({ field, htmlFor }: { field: UIFieldSchema; htmlFor?: string }) {
  let displayLabel = field.label || field.key;
  if (field.required) {
    if (displayLabel.includes('\n')) {
      const idx = displayLabel.indexOf('\n');
      displayLabel = displayLabel.slice(0, idx) + '*' + displayLabel.slice(idx);
    } else {
      displayLabel = displayLabel + '*';
    }
  }

  return (
    <label htmlFor={htmlFor} style={{ ...labelStyle, whiteSpace: 'pre-line' }}>
      {displayLabel}
    </label>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <div
      id={id}
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        marginTop: '4px',
        color: 'var(--danger)',
        fontSize: '11px',
        paddingLeft: '118px',
      }}
    >
      <AlertCircle size={12} aria-hidden="true" />
      <span>{error}</span>
    </div>
  );
}

const ButtonField: FieldRenderer = ({ field }) => {
  const {
    inputs,
    validationErrors,
    fieldErrors,
    clearFieldError,
    setLocationModalOpen,
    setAdditionalInputsOpen,
    location,
    isLocked,
  } = useBridgeStore();

  const isError = Boolean(fieldErrors[field.key]);
  const error = validationErrors[field.key];
  const hasLocation = Boolean(location || inputs['project.location']);
  const locationText = location
    ? `${location.station}, ${location.state}`
    : (inputs['project.location'] || 'Not Selected');

  const buttonText =
    field.button_label ||
    (field.key === 'project.location' || field.action === 'show_project_location_dialog'
      ? 'Select Location'
      : field.key === 'geometry.additional_btn' || field.action === 'show_additional_inputs'
      ? 'Modify Here'
      : field.label || 'Action');

  const showLocationPin =
    (field.key === 'project.location' || field.post_row?.kind === 'info_row') && hasLocation;

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FieldLabel field={field} />
        <button
          type="button"
          disabled={isLocked}
          aria-label={buttonText}
          onClick={() => {
            clearFieldError(field.key);
            if (
              field.action === 'open_project_location_modal' ||
              field.action === 'show_project_location_dialog' ||
              field.key === 'project.location'
            ) {
              setLocationModalOpen(true);
            } else if (
              field.action === 'show_additional_inputs' ||
              field.key === 'geometry.additional_btn'
            ) {
              setAdditionalInputsOpen(true);
            }
          }}
          className={`osdag-action-btn${isError ? ' has-error' : ''}`}
          style={{
            flex: 1,
            cursor: isLocked ? 'not-allowed' : 'pointer',
            opacity: isLocked ? 0.65 : 1,
          }}
        >
          {buttonText}
        </button>
      </div>

      {showLocationPin && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '6px',
            fontSize: '11px',
            color: 'var(--text-main)',
          }}
        >
          <img
            src="/vectors/location_pin.svg"
            alt=""
            width={16}
            height={16}
            style={{ objectFit: 'contain' }}
          />
          <span>{locationText}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '4px',
            color: 'var(--danger)',
            fontSize: '11px',
            paddingLeft: '118px',
          }}
        >
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

const SelectField: FieldRenderer = ({ field }) => {
  const {
    inputs,
    updateField,
    validateFieldLive,
    validationErrors,
    fieldErrors,
    clearFieldError,
    isLocked,
    openMaterialInfo,
    customMaterials,
  } = useBridgeStore();

  const value = inputs[field.key] ?? field.default ?? '';
  const isError = Boolean(fieldErrors[field.key]);
  const error = validationErrors[field.key];
  const fieldId = `field-${field.key}`;
  const errorId = `${fieldId}-error`;

  const isMaterial = Boolean(
    field.is_material_field ||
    field.group === 'Material Inputs' ||
    field.key.startsWith('material.')
  );
  const isConcrete = isMaterial && /concrete|deck/i.test(`${field.key} ${field.group ?? ''}`);
  const customOptions = isMaterial
    ? Object.values(customMaterials)
        .filter((m) => (isConcrete ? m.memberType === 'Concrete' : m.memberType === 'Steel'))
        .map((m) => m.name)
    : [];

  let mergedOptions = Array.from(new Set([...(field.options ?? []), ...customOptions]));
  if (isMaterial) {
    mergedOptions = [...mergedOptions.filter((opt) => opt !== 'Custom'), 'Custom'];
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value;
    clearFieldError(field.key);
    if (isMaterial && newVal === 'Custom') {
      openMaterialInfo(field.key, false);
      return;
    }
    updateField(field.key, newVal);
    validateFieldLive(field.key, newVal);
  };

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FieldLabel field={field} htmlFor={fieldId} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
          <select
            id={fieldId}
            value={value}
            disabled={isLocked}
            aria-invalid={isError || Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            aria-required={field.required || undefined}
            onChange={handleChange}
            className={`osdag-select-field${isError || error ? ' has-error' : ''}`}
            style={{
              flex: 1,
              width: '100%',
              opacity: isLocked ? 0.65 : 1,
            }}
          >
            {mergedOptions.map((opt) => (
              <option
                key={opt}
                value={opt}
                disabled={
                  field.disabled_options?.includes(opt) ||
                  (field.key === 'structure.type' && opt === 'Other')
                }
              >
                {opt}
              </option>
            ))}
          </select>

          {/* Desktop Material Info (ℹ) button */}
          {isMaterial && (
            <button
              type="button"
              title="View material properties"
              aria-label={`View properties for ${field.label || field.key}`}
              onClick={() => openMaterialInfo(field.key, true)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                flexShrink: 0,
              }}
            >
              <img
                src="/vectors/msg_about.svg"
                alt="i"
                width={18}
                height={18}
                style={{ objectFit: 'contain' }}
              />
            </button>
          )}
        </div>
      </div>
      <FieldError id={errorId} error={error} />
    </div>
  );
};

const CheckboxField: FieldRenderer = ({ field }) => {
  const { inputs, updateField, validateFieldLive, fieldErrors, clearFieldError, isLocked } = useBridgeStore();
  const value = inputs[field.key] ?? field.default ?? false;
  const fieldId = `field-${field.key}`;

  return (
    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <FieldLabel field={field} htmlFor={fieldId} />
      <input
        id={fieldId}
        type="checkbox"
        checked={Boolean(value)}
        disabled={isLocked}
        aria-required={field.required || undefined}
        onChange={(e) => {
          clearFieldError(field.key);
          updateField(field.key, e.target.checked);
          validateFieldLive(field.key, e.target.checked);
        }}
        style={{
          width: '16px',
          height: '16px',
          accentColor: 'var(--accent-osdag)',
          cursor: isLocked ? 'not-allowed' : 'pointer',
        }}
      />
    </div>
  );
};

const NoteField: FieldRenderer = ({ field }) => (
  <p
    role="note"
    style={{
      marginBottom: '8px',
      fontSize: '11px',
      color: 'var(--text-sub)',
      lineHeight: 1.4,
      padding: '6px 8px',
      background: 'var(--bg-grouped)',
      borderRadius: '4px',
      borderLeft: '3px solid var(--accent-osdag)',
    }}
  >
    {field.note || field.label}
  </p>
);

const TextOrNumberField: FieldRenderer = ({ field }) => {
  const {
    inputs,
    updateField,
    validateFieldLive,
    validateBasicInputs,
    setValidationError,
    showMessageModal,
    validationErrors,
    fieldErrors,
    clearFieldError,
    isLocked,
  } = useBridgeStore();

  const value = inputs[field.key] ?? field.default ?? '';
  const isError = Boolean(fieldErrors[field.key]);
  const error = validationErrors[field.key];
  const [localVal, setLocalVal] = useState<string>(value !== null && value !== undefined ? String(value) : '');
  const fieldId = `field-${field.key}`;
  const errorId = `${fieldId}-error`;
  const isNumber =
    field.ui_type === 'number' ||
    field.validator === 'Double Validator' ||
    field.validator === 'Integer Validator' ||
    typeof field.min === 'number' ||
    field.unit === 'm' ||
    field.unit === '°';

  useEffect(() => {
    setLocalVal(value !== null && value !== undefined ? String(value) : '');
  }, [value]);

  // Dynamic placeholder resolution (matches desktop _carriageway_placeholder_text)
  let placeholderText = field.placeholder || '';
  if (!placeholderText && (field.placeholder_dynamic === '_carriageway_placeholder_text' || field.key === 'geometry.carriageway_width')) {
    const isMedian = inputs['geometry.include_median'] === 'Yes';
    placeholderText = isMedian ? '7.5–23.6 m' : '4.25–23.6 m';
  }

  const handleTyping = (newVal: string) => {
    clearFieldError(field.key);
    setLocalVal(newVal);
    const num = Number(newVal);
    updateField(field.key, isNumber && !isNaN(num) && newVal.trim() !== '' ? num : newVal);
  };

  const handleBlur = async () => {
    const num = Number(localVal);
    const finalVal = isNumber && !isNaN(num) && localVal.trim() !== '' ? num : localVal.trim();
    updateField(field.key, finalVal);

    // Call backend live validation against IRC / Osdag design constraints
    const res = await validateInputs({
      key: field.key,
      value: finalVal,
      all_inputs: { ...inputs, [field.key]: finalVal },
    });

    if (res) {
      if (!res.valid) {
        showMessageModal({
          title: 'Input Error',
          message: res.message || 'Invalid input value.',
          type: 'warning',
        });
        setValidationError(field.key, res.message || 'Invalid input value');
        if (res.corrected_value !== undefined && res.corrected_value !== null) {
          setLocalVal(String(res.corrected_value));
          updateField(field.key, res.corrected_value);
        }
      } else {
        setValidationError(field.key, null);
      }
    } else {
      // Fallback to local validator if backend is unreachable
      const result = validateBasicInputs(field.key, finalVal);
      if (!result.valid) {
        showMessageModal({
          title: 'Input Error',
          message: result.message || 'Invalid input value.',
          type: 'warning',
        });
        setValidationError(field.key, result.message || 'Invalid input value');
        if (result.corrected !== undefined) {
          setLocalVal(String(result.corrected));
          updateField(field.key, result.corrected);
        }
      } else {
        setValidationError(field.key, null);
      }
    }
  };

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FieldLabel field={field} htmlFor={fieldId} />
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <input
            id={fieldId}
            type={isNumber ? 'number' : 'text'}
            inputMode={isNumber ? 'decimal' : undefined}
            step={field.step ?? (isNumber ? 'any' : undefined)}
            min={isNumber && field.min !== null && field.min !== undefined ? field.min : undefined}
            max={isNumber && field.max !== null && field.max !== undefined ? field.max : undefined}
            value={localVal}
            placeholder={placeholderText}
            disabled={isLocked}
            aria-invalid={isError || Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            aria-required={field.required || undefined}
            onChange={(e) => handleTyping(e.target.value)}
            onBlur={handleBlur}
            className={`osdag-input-field${isError || error ? ' has-error' : ''}`}
            style={{
              width: '100%',
              paddingRight: field.unit ? '32px' : '7px',
              cursor: isLocked ? 'not-allowed' : 'text',
              opacity: isLocked ? 0.65 : 1,
            }}
          />
          {field.unit && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: '6px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-sub)',
                pointerEvents: 'none',
                background: 'var(--border-subtle)',
                padding: '1px 3px',
                borderRadius: '3px',
              }}
            >
              {field.unit}
            </span>
          )}
        </div>
      </div>
      <FieldError id={errorId} error={error} />
    </div>
  );
};

registerFieldType('button', ButtonField);
registerFieldType('select', SelectField);
registerFieldType('combobox', SelectField);
registerFieldType('dropdown', SelectField);
registerFieldType('checkbox', CheckboxField);
registerFieldType('note', NoteField);
registerFieldType('number', TextOrNumberField);
registerFieldType('textbox', TextOrNumberField);
registerFieldType('text', TextOrNumberField);

const UnsupportedField: FieldRenderer = ({ field }) => (
  <p role="alert" style={{ marginBottom: '8px', color: 'var(--danger)', fontSize: '11px' }}>
    Unsupported input type &quot;{field.ui_type}&quot; for {field.label || field.key}.
  </p>
);

export const SchemaField: React.FC<{ field: UIFieldSchema }> = ({ field }) => {
  const Renderer = fieldRenderers[field.ui_type] ?? UnsupportedField;
  return <Renderer field={field} />;
};

