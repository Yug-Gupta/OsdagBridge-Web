/**
 * SchemaField.tsx
 *
 * Renders a single UI field driven by a UIFieldSchema entry from the backend.
 * Adapts osdagbridge.desktop.ui.docks.dock_utils apply_field_style and the
 * field-row building logic from input_dock.py to a registry-based React approach.
 *
 * Field type registry:
 *   - All renderers are registered via registerFieldType().
 *   - SchemaField resolves the renderer by ui_type at render time.
 *   - New field types can be injected externally without modifying this file.
 *
 * Supported ui_type values:
 *   button, combobox, select, dropdown, checkbox, note, number, text, textbox
 */

import React, { useState, useEffect } from 'react';
import { UIFieldSchema } from '../../types/schema';
import { useBridgeStore } from '../../store/useBridgeStore';
import { AlertCircle } from 'lucide-react';

// ── Field Renderer Registry ────────────────────────────────────────────────────

export type FieldRenderer = React.FC<{ field: UIFieldSchema }>;

const fieldRenderers: Record<string, FieldRenderer> = {};

/** Register an additional schema `ui_type` renderer without rewriting the form. */
export function registerFieldType(uiType: string, renderer: FieldRenderer) {
  fieldRenderers[uiType] = renderer;
}

// ── Shared Sub-Components ──────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  minWidth: '110px',
  maxWidth: '120px',
  fontSize: '12px',
  color: 'var(--text-main)',
  fontWeight: 500,
  lineHeight: 1.25,
};

function FieldLabel({ field, htmlFor }: { field: UIFieldSchema; htmlFor?: string }) {
  let displayLabel = field.label;
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

// ── Field Renderers ────────────────────────────────────────────────────────────

/**
 * ButtonField — mirrors TYPE_BUTTON rows in input_dock.py.
 * For project.location, opens the ProjectLocation dialog.
 * Other button fields are visual-only in this basic UI.
 */
const ButtonField: FieldRenderer = ({ field }) => {
  const { inputs, location, isLocked, setLocationModalOpen } = useBridgeStore();

  const isLocationField =
    field.key === 'project.location' ||
    field.action === 'show_project_location_dialog' ||
    field.action === 'open_project_location_modal';

  const locationText = location
    ? `${location.station}, ${location.state}`
    : (inputs['project.location'] || 'New Delhi, Delhi');
  const hasLocation = Boolean(locationText);
  const buttonText = isLocationField
    ? (location ? `${location.station}, ${location.state}` : (inputs['project.location'] || field.button_label || 'Delhi, India'))
    : (field.button_label || field.label);
  const showPin = (field.post_row?.kind === 'info_row' || isLocationField) && hasLocation;

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FieldLabel field={field} />
        <button
          type="button"
          disabled={isLocked}
          aria-label={buttonText}
          onClick={() => {
            if (isLocationField) {
              setLocationModalOpen(true);
            }
          }}
          className="osdag-action-btn"
          style={{
            flex: 1,
            cursor: isLocked ? 'not-allowed' : 'pointer',
            opacity: isLocked ? 0.65 : 1,
          }}
        >
          {buttonText}
        </button>
      </div>

      {/* Location pin info row (mirrors post_row: info_row in input_values) */}
      {showPin && (
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
    </div>
  );
};

/**
 * SelectField (combobox) — mirrors TYPE_COMBOBOX rows in input_dock.py.
 * Material fields include a visual-only properties info button.
 */
const SelectField: FieldRenderer = ({ field }) => {
  const { inputs, updateField, isLocked } = useBridgeStore();

  const value = inputs[field.key] ?? field.default ?? '';
  const fieldId = `field-${field.key}`;

  const isMaterialField = Boolean(
    field.is_material_field || field.group === 'Material Inputs' || field.key.startsWith('material.')
  );

  const options = field.options ?? [];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateField(field.key, e.target.value);
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
            aria-required={field.required || undefined}
            onChange={handleChange}
            className="osdag-select-field"
            style={{
              flex: 1,
              width: '100%',
              opacity: isLocked ? 0.65 : 1,
            }}
          >
            {options.map((opt) => (
              <option
                key={opt}
                value={opt}
                disabled={field.disabled_options?.includes(opt)}
              >
                {opt}
              </option>
            ))}
          </select>

          {/* Material Info button — visual only in basic UI */}
          {isMaterialField && (
            <button
              type="button"
              title="View material properties"
              aria-label={`View properties for ${field.label}`}
              onClick={() => {}}
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
    </div>
  );
};

/**
 * CheckboxField — mirrors TYPE_CHECKBOX rows in input_dock.py.
 */
const CheckboxField: FieldRenderer = ({ field }) => {
  const { inputs, updateField, isLocked } = useBridgeStore();
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
          updateField(field.key, e.target.checked);
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

/**
 * NoteField — mirrors TYPE_NOTE rows in input_dock.py.
 * Renders an informational text block with a left accent border.
 */
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

/**
 * TextOrNumberField — mirrors TYPE_TEXTBOX rows in input_dock.py.
 * Applies numeric validation cues and dynamic placeholder resolution.
 */
const TextOrNumberField: FieldRenderer = ({ field }) => {
  const { inputs, updateField, isLocked } = useBridgeStore();

  const value = inputs[field.key] ?? field.default ?? '';
  const [localVal, setLocalVal] = useState<string>(value !== null && value !== undefined ? String(value) : '');
  const fieldId = `field-${field.key}`;
  const isNumber =
    field.ui_type === 'number' ||
    (field.ui_type === 'textbox' &&
      (field.min != null ||
        field.max != null ||
        field.step != null ||
        typeof field.default === 'number' ||
        Boolean(field.unit)));

  // Sync local display value when external store value changes
  useEffect(() => {
    setLocalVal(value !== null && value !== undefined ? String(value) : '');
  }, [value]);

  // Dynamic placeholder resolution (matches desktop _carriageway_placeholder_text)
  let placeholderText = field.placeholder || '';
  if (
    field.placeholder_dynamic === '_carriageway_placeholder_text' ||
    field.key === 'geometry.carriageway_width'
  ) {
    const isMedian = inputs['geometry.include_median'] === 'Yes';
    placeholderText = isMedian ? '7.5–23.6 m' : '4.25–23.6 m';
  } else if (!placeholderText && field.key === 'geometry.skew_angle') {
    placeholderText = '-15.0–15.0°';
  } else if (!placeholderText && field.key === 'geometry.span') {
    placeholderText = '10.0–45.0 m';
  }

  const handleTyping = (newVal: string) => {
    setLocalVal(newVal);
    const num = Number(newVal);
    updateField(field.key, isNumber && !isNaN(num) && newVal.trim() !== '' ? num : newVal);
  };

  const handleBlur = () => {
    const num = Number(localVal);
    const finalVal = isNumber && !isNaN(num) && localVal.trim() !== '' ? num : localVal.trim();
    updateField(field.key, finalVal);
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
            min={isNumber && field.min != null ? field.min : undefined}
            max={isNumber && field.max != null ? field.max : undefined}
            value={localVal}
            placeholder={placeholderText}
            disabled={isLocked}
            aria-required={field.required || undefined}
            onChange={(e) => handleTyping(e.target.value)}
            onBlur={handleBlur}
            className="osdag-input-field"
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
    </div>
  );
};

// ── Field Type Registry ────────────────────────────────────────────────────────

registerFieldType('button', ButtonField);
registerFieldType('select', SelectField);
registerFieldType('dropdown', SelectField);
registerFieldType('combobox', SelectField);
registerFieldType('checkbox', CheckboxField);
registerFieldType('note', NoteField);
registerFieldType('number', TextOrNumberField);
registerFieldType('text', TextOrNumberField);
registerFieldType('textbox', TextOrNumberField);

const UnsupportedField: FieldRenderer = ({ field }) => (
  <p role="alert" style={{ marginBottom: '8px', color: 'var(--danger)', fontSize: '11px' }}>
    Unsupported input type &quot;{field.ui_type}&quot; for {field.label}.
  </p>
);

// ── Public Component ───────────────────────────────────────────────────────────

export const SchemaField: React.FC<{ field: UIFieldSchema }> = ({ field }) => {
  const normalizedType = (field.ui_type || '').toLowerCase();
  const Renderer = fieldRenderers[normalizedType] ?? fieldRenderers[field.ui_type] ?? UnsupportedField;
  return <Renderer field={field} />;
};
