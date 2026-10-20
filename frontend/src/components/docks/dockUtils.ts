/**
 * dockUtils.ts
 *
 * Shared utility functions and style helpers for the dock components.
 * Adapts osdagbridge.desktop.ui.docks.dock_utils for the web layer.
 *
 * apply_field_style from the desktop dock_utils.py is represented here as
 * getFieldStyle() and getComboboxStyle(), returning React.CSSProperties objects
 * that dock form fields can spread onto their style prop.
 */

import React from 'react';

// ── Field Style Options ─────────────────────────────────────────────────────────

export interface FieldStyleOptions {
  disabled?: boolean;
  hasError?: boolean;
  minHeight?: number;
}

// ── Style Helpers ──────────────────────────────────────────────────────────────

/**
 * Returns common input field styles matching desktop dock_utils.apply_field_style.
 * Used by text and number fields.
 */
export const getFieldStyle = (options: FieldStyleOptions = {}): React.CSSProperties => {
  const { disabled = false, hasError = false, minHeight = 28 } = options;

  return {
    minHeight: `${minHeight}px`,
    padding: '1px 7px',
    border: `1px solid ${hasError ? '#FF0000' : disabled ? '#666666' : 'var(--border-color)'}`,
    borderRadius: '5px',
    backgroundColor: disabled ? 'var(--bg-disabled, #f1f1f1)' : 'var(--bg-surface)',
    color: disabled ? '#666666' : 'var(--text-main)',
    fontSize: '12px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease',
  };
};

/**
 * Returns common combobox (select) styles matching desktop dock_utils.
 * Delegates to getFieldStyle since the style set is identical.
 */
export const getComboboxStyle = (options: FieldStyleOptions = {}): React.CSSProperties => {
  return getFieldStyle(options);
};
