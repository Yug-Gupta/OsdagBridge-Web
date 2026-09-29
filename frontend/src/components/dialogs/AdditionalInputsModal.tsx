import React, { useEffect, useState } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { X, Layers, Save, RotateCcw } from 'lucide-react';
import { AdditionalInputsSchema, collectFieldIds } from '../forms/AdditionalInputsSchema';

/**
 * Web port of osdagbridge.desktop.ui.dialogs.additional_input.additional_inputs.AdditionalInputs.
 *
 * The desktop dialog is a tabbed form driven by ADDITIONAL_INPUTS_SCHEMA.
 * Here the same schema is fetched through the API layer (mock JSON fallback)
 * and rendered by the recursive AdditionalInputsSchema renderer.
 */
export const AdditionalInputsModal: React.FC = () => {
  const {
    isAdditionalInputsOpen,
    setAdditionalInputsOpen,
    additionalInputsSchema,
    additionalInputsSchemaLoading,
    additionalInputsSchemaError,
    fetchAdditionalInputsSchema,
    applyAdditionalInputs,
    resetAdditionalInputs,
  } = useBridgeStore();

  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (isAdditionalInputsOpen) {
      void fetchAdditionalInputsSchema();
    }
  }, [isAdditionalInputsOpen, fetchAdditionalInputsSchema]);

  if (!isAdditionalInputsOpen) return null;

  const tabs = additionalInputsSchema as { label?: string; schema?: unknown }[];
  const current = tabs[Math.min(activeTab, Math.max(tabs.length - 1, 0))];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--overlay-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(2px)'
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--accent-osdag)',
        borderRadius: '6px',
        width: '900px',
        maxWidth: '96vw',
        height: '620px',
        maxHeight: '92vh',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--bg-grouped)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--accent-osdag)" />
            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>
              Additional Inputs — Highway Bridge Design
            </span>
          </div>
          <button
            onClick={() => setAdditionalInputsOpen(false)}
            aria-label="Close additional inputs"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-sub)',
              padding: '2px',
              display: 'flex'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Top-level Tab Strip (desktop ADDITIONAL_INPUTS_SCHEMA order) */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
          padding: '0 12px'
        }}>
          {tabs.map((tab, i) => (
            <button
              key={`${tab.label ?? i}`}
              type="button"
              onClick={() => setActiveTab(i)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderBottom: activeTab === i ? '2px solid var(--accent-osdag)' : '2px solid transparent',
                background: 'transparent',
                color: activeTab === i ? 'var(--accent-osdag)' : 'var(--text-sub)',
                fontWeight: activeTab === i ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {tab.label ?? `Tab ${i + 1}`}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {additionalInputsSchemaLoading && (
            <div style={{ color: 'var(--text-sub)', fontSize: '12px' }}>Loading additional inputs…</div>
          )}
          {additionalInputsSchemaError && (
            <div role="alert" style={{ color: 'var(--danger)', fontSize: '12px' }}>
              Unable to load additional inputs: {additionalInputsSchemaError}
            </div>
          )}
          {!additionalInputsSchemaLoading && !additionalInputsSchemaError && current && (
            <AdditionalInputsSchema schema={current.schema} />
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 16px',
          background: 'var(--bg-grouped)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px'
        }}>
          <button
            onClick={() => {
              if (current?.schema) {
                resetAdditionalInputs(Array.from(collectFieldIds(current.schema)));
              }
            }}
            style={{
              padding: '6px 16px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginRight: 'auto',
            }}
          >
            <RotateCcw size={14} />
            Defaults
          </button>
          <button
            onClick={() => setAdditionalInputsOpen(false)}
            style={{
              padding: '6px 16px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              applyAdditionalInputs();
              setAdditionalInputsOpen(false);
            }}
            style={{
              padding: '6px 16px',
              borderRadius: '4px',
              border: 'none',
              background: 'var(--accent-osdag)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Save size={14} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
