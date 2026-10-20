/**
 * SchemaField.tsx
 *
 * Input field renderer for Highway Bridge Design GUI.
 * Mirrors the field-row building logic of osdagbridge.desktop.ui.docks.input_dock.
 *
 * Design principles (adapted from desktop input_dock.py):
 *   - Label comes from field.label (tuple[1] in desktop).
 *   - Defaults live in field.default.
 *   - TYPE_BUTTON and TYPE_NOTE are first-class field rows.
 *   - Direct if-else branching for field types matching desktop field creation:
 *       if type in COMBOBOX: render combobox
 *       elif type in TEXTBOX / LINE_EDIT: render textbox
 *       elif type in BUTTON: render button
 *       elif type in NOTE: render note
 *       elif type in CHECKBOX: render checkbox
 */

import React, { useState, useEffect } from 'react';
import { UIFieldSchema } from '../../types/schema';
import { useBridgeStore } from '../../store/useBridgeStore';
import { AlertCircle } from 'lucide-react';
import {
  TYPE_BUTTON,
  TYPE_COMBOBOX,
  TYPE_COMBO_BOX,
  TYPE_TEXTBOX,
  TYPE_LINE_EDIT,
  TYPE_NOTE,
  TYPE_CHECKBOX,
  KEY_INCLUDE_MEDIAN,
} from '../../utils/bridgeInputs';

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

// ── Field Renderers (mirrors desktop widget factories in input_dock.py) ────────

/**
 * ButtonField — mirrors the metadata-driven TYPE_BUTTON row in input_dock.py.
 * The schema action selects the supported web callback; the field key does not.
 */
const ButtonField: React.FC<{ field: UIFieldSchema }> = ({ field }) => {
  const { inputs, location, isLocked, setLocationModalOpen } = useBridgeStore();

  const opensLocationDialog =
    field.action === 'show_project_location_dialog' ||
    field.action === 'open_project_location_modal';

  const locationText = location
    ? `${location.station}, ${location.state}`
    : (inputs['project.location'] || 'New Delhi, Delhi');
  const hasLocation = Boolean(locationText);
  const buttonText = opensLocationDialog
    ? (location ? `${location.station}, ${location.state}` : (inputs['project.location'] || field.button_label || 'Delhi, India'))
    : (field.button_label || field.label);
  const showPin = field.post_row?.kind === 'info_row' && hasLocation;

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FieldLabel field={field} />
        <button
          type="button"
          disabled={isLocked}
          onClick={() => {
            if (opensLocationDialog) {
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

      {showPin && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '4px',
            paddingLeft: '118px',
            fontSize: '11px',
            color: 'var(--text-sub)',
          }}
        >
          <span aria-hidden="true">📍</span>
          <span>{locationText}</span>
        </div>
      )}
    </div>
  );
};

/**
 * SelectField — mirrors the desktop combobox factory.
 * Disabled schema options remain visible but cannot be selected.
 */
const SelectField: React.FC<{ field: UIFieldSchema }> = ({ field }) => {
  const { inputs, updateField, isLocked } = useBridgeStore();
  const value = inputs[field.key] ?? field.default ?? '';
  const options = field.options || [];
  const fieldId = `field-${field.key}`;

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
            onChange={(e) => {
              updateField(field.key, e.target.value);
            }}
            className="osdag-select-field"
            style={{
              flex: 1,
              width: '100%',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              opacity: isLocked ? 0.65 : 1,
            }}
          >
            {field.placeholder && (
              <option value="" disabled>
                {field.placeholder}
              </option>
            )}
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
          {field.is_material_field && (
            <button
              type="button"
              title="View material properties"
              aria-label={`View properties for ${field.label}`}
              onClick={() => {}}
              style={{
                width: '20px',
                height: '20px',
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <img src="/vectors/msg_about.svg" alt="" width={18} height={18} />
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
const CheckboxField: React.FC<{ field: UIFieldSchema }> = ({ field }) => {
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
const NoteField: React.FC<{ field: UIFieldSchema }> = ({ field }) => (
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
 * Keeps edits local until focus leaves the field, matching desktop editingFinished.
 */
const TextOrNumberField: React.FC<{ field: UIFieldSchema }> = ({ field }) => {
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

  // Desktop records the placeholder method in schema metadata; keep the web
  // equivalent metadata-driven instead of branching on a field key.
  const resolvedPlaceholder = (() => {
    if (field.placeholder_dynamic === '_carriageway_placeholder_text') {
      const hasMedian = inputs[KEY_INCLUDE_MEDIAN] === 'Yes';
      return hasMedian ? '≥ 8.5' : '4.25 – 24';
    }
    return field.placeholder;
  })();

  const handleTyping = (raw: string) => {
    setLocalVal(raw);
  };

  const handleBlur = () => {
    const trimmed = localVal.trim();

    if (!isNumber) {
      updateField(field.key, trimmed);
      return;
    }

    if (trimmed === '') {
      updateField(field.key, null);
      return;
    }
    const n = Number(trimmed);
    if (!Number.isNaN(n)) {
      let clamped = n;
      if (field.min != null && clamped < field.min) clamped = field.min;
      if (field.max != null && clamped > field.max) clamped = field.max;
      setLocalVal(String(clamped));
      updateField(field.key, clamped);
    }
  };

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FieldLabel field={field} htmlFor={fieldId} />
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            id={fieldId}
            type="text"
            inputMode={isNumber ? 'decimal' : 'text'}
            value={localVal}
            placeholder={resolvedPlaceholder}
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

// ── Public Component ───────────────────────────────────────────────────────────

/**
 * SchemaField
 *
 * Direct if-else branching for field types mirroring desktop input_dock.py:
 *   if field_type == TYPE_BUTTON: ...
 *   elif field_type == TYPE_COMBO_BOX: ...
 *   elif field_type == TYPE_TEXTBOX: ...
 *   elif field_type == TYPE_CHECKBOX: ...
 *   elif field_type == TYPE_NOTE: ...
 */
export const SchemaField: React.FC<{ field: UIFieldSchema }> = ({ field }) => {
  const type = (field.ui_type || '').toLowerCase();

  // Desktop field creation branching (mirrors input_dock.py _build_field_loop)
  if (type === TYPE_BUTTON) {
    return <ButtonField field={field} />;
  } else if (
    type === TYPE_COMBOBOX ||
    type === TYPE_COMBO_BOX ||
    type === 'select' ||
    type === 'dropdown'
  ) {
    return <SelectField field={field} />;
  } else if (
    type === TYPE_TEXTBOX ||
    type === TYPE_LINE_EDIT ||
    type === 'text' ||
    type === 'number' ||
    type === 'spin_box' ||
    type === 'file_browser'
  ) {
    return <TextOrNumberField field={field} />;
  } else if (type === TYPE_CHECKBOX) {
    return <CheckboxField field={field} />;
  } else if (type === TYPE_NOTE) {
    return <NoteField field={field} />;
  } else {
    return (
      <p role="alert" style={{ marginBottom: '8px', color: 'var(--danger)', fontSize: '11px' }}>
        Unsupported input type &quot;{field.ui_type}&quot; for {field.label}.
      </p>
    );
  }
};
