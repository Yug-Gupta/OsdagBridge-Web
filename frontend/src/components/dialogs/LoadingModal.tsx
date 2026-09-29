import React from 'react';
import { Loader2, X } from 'lucide-react';
import { useBridgeStore } from '../../store/useBridgeStore';

/**
 * Web port of osdagbridge.desktop.ui.dialogs.loading_popup.LoadingDialogManager.
 *
 * Shown while a design/analysis run is in flight; displays progress, the live
 * log stream and a Cancel action that aborts the run.
 */
export const LoadingModal: React.FC = () => {
  const { isDesignRunning, designProgress, logs, cancelDesign } = useBridgeStore();

  if (!isDesignRunning) return null;

  const recent = logs.slice(-6);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Analysis and design in progress"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--accent-osdag)',
          borderRadius: '6px',
          width: '520px',
          maxWidth: '92vw',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: 'var(--bg-grouped)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Loader2 size={17} color="var(--accent-osdag)" className="osdag-spin" />
            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>
              Analysis &amp; Design in progress
            </span>
          </div>
          <button
            type="button"
            onClick={cancelDesign}
            title="Cancel analysis"
            aria-label="Cancel analysis"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sub)', display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '16px' }}>
          <div
            style={{
              height: '8px',
              borderRadius: '4px',
              background: 'var(--border-subtle)',
              overflow: 'hidden',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                width: `${Math.max(0, Math.min(100, designProgress))}%`,
                height: '100%',
                background: 'var(--accent-osdag)',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-sub)', marginBottom: '12px' }}>
            {designProgress}% complete
          </div>

          <div
            style={{
              maxHeight: '150px',
              overflowY: 'auto',
              background: 'var(--log-bg, #0f172a)',
              color: 'var(--log-text, #cbd5e1)',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '11px',
              lineHeight: 1.5,
              padding: '8px 10px',
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
            }}
          >
            {recent.map((entry) => (
              <div key={entry.id}>{entry.message}</div>
            ))}
          </div>
        </div>

        <div
          style={{
            padding: '10px 16px',
            background: 'var(--bg-grouped)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={cancelDesign}
            style={{
              padding: '6px 18px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              background: 'var(--input-bg)',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
