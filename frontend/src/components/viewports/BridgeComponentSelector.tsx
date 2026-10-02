import React from 'react';
import { useBridgeStore, type CadComponentVisibility } from '../../store/useBridgeStore';
import type { ViewerCadModel } from '../../types/viewerCadModel';

interface BridgeComponentSelectorProps {
  params: ViewerCadModel;
}

export const BridgeComponentSelector: React.FC<BridgeComponentSelectorProps> = ({ params }) => {
  const { cadComponents, setCadComponentVisibility } = useBridgeStore();

  const hasFootpath = params.footpath_config !== 'NONE';
  const hasMedian = Boolean(params.median_enabled);

  const items: { key: keyof CadComponentVisibility; label: string; visible: boolean }[] = [
    { key: 'bridge', label: 'Bridge', visible: true },
    { key: 'girder', label: 'Girder', visible: true },
    { key: 'deck', label: 'Deck', visible: true },
    { key: 'crossBracing', label: 'Cross Bracing', visible: true },
    { key: 'crashBarrier', label: 'Crash Barrier', visible: true },
    { key: 'median', label: 'Median', visible: hasMedian },
    { key: 'railing', label: 'Railing', visible: hasFootpath },
  ];

  return (
    <div
      className="cad-component-selector"
      style={{
        height: '30px',
        minHeight: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '18px',
        padding: '0 12px',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-color)',
        fontSize: '12px',
        color: 'var(--text-main)',
        userSelect: 'none',
        overflowX: 'auto',
      }}
    >
      {items
        .filter((item) => item.visible)
        .map(({ key, label }) => {
          const checked = cadComponents[key];
          return (
            <label
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontWeight: checked ? 600 : 400,
                color: checked ? 'var(--text-main)' : 'var(--text-sub)',
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => setCadComponentVisibility(key)}
                style={{
                  cursor: 'pointer',
                  accentColor: 'var(--accent-osdag, #90af13)',
                  width: '14px',
                  height: '14px',
                }}
              />
              <span>{label}</span>
            </label>
          );
        })}
    </div>
  );
};
