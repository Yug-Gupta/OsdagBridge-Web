import React from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { AlertTriangle, X } from 'lucide-react';

export const ClearResultsConfirmModal: React.FC = () => {
  const { isUnlockConfirmOpen, setUnlockConfirmOpen, confirmUnlock } = useBridgeStore();

  if (!isUnlockConfirmOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.55)',
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
        width: '420px',
        maxWidth: '90vw',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
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
            <AlertTriangle size={18} color="#fa7a02" />
            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>
              Clear Results
            </span>
          </div>
          <button
            onClick={() => setUnlockConfirmOpen(false)}
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

        {/* Content */}
        <div style={{ padding: '16px', fontSize: '12px', color: 'var(--text-main)' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>
            Unlocking will delete all results and plots.
          </p>
          <p style={{ margin: 0, color: 'var(--text-sub)' }}>
            Do you want to continue?
          </p>
        </div>

        {/* Actions */}
        <div style={{
          padding: '10px 16px',
          background: 'var(--bg-grouped)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px'
        }}>
          <button
            onClick={() => setUnlockConfirmOpen(false)}
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
            onClick={() => confirmUnlock()}
            style={{
              padding: '6px 16px',
              borderRadius: '4px',
              border: 'none',
              background: '#fa7a02',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};
