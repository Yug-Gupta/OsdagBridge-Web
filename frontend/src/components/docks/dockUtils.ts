/**
 * dockUtils.ts - Utility functions for docks in OsdagBridge Web.
 * Mirrors osdagbridge.desktop.ui.docks.dock_utils
 */

export interface FieldStyleOptions {
  disabled?: boolean;
  hasError?: boolean;
  minHeight?: number;
}

/**
 * Common input field styles matching desktop dock_utils.apply_field_style
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
 * Common combobox styles matching desktop dock_utils
 */
export const getComboboxStyle = (options: FieldStyleOptions = {}): React.CSSProperties => {
  return getFieldStyle(options);
};
