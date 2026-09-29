/**
 * CadDualViewDock.tsx
 * Web implementation of OsdagBridge Dual CAD View Widget.
 * Mirrors osdagbridge.desktop.ui.docks.cad_dual_view.BridgeDualCADWidget
 *
 * Combines Cross-Section view and Plan/Top view in a vertical split layout:
 *   - Upper pane: CadCrossSectionDock
 *   - Lower pane: CadTopViewDock
 *   - Draggable horizontal splitter with hover accent
 *   - View toggles (Show Cross Section, Show Top View, Show Both)
 *   - Independent zoom and pan controls per viewport
 */

import React, { useState } from 'react';
import { CadCrossSectionDock } from './CadCrossSectionDock';
import { CadTopViewDock } from './CadTopViewDock';
import { Layers, Eye, X } from 'lucide-react';
import { useBridgeStore } from '../../store/useBridgeStore';

export interface CadDualViewDockProps {
  visible?: boolean;
  onClose?: () => void;
  isStandalone?: boolean;
}

export const CadDualViewDock: React.FC<CadDualViewDockProps> = ({
  visible = true,
  onClose,
  isStandalone = true,
}) => {
  const store = useBridgeStore();
  const showCrossSection = isStandalone ? true : store.showCrossSection;
  const showTopView = isStandalone ? true : store.showTopView;
  const [splitRatio, setSplitRatio] = useState(0.5); // 50% / 50%
  const [isResizing, setIsResizing] = useState(false);

  if (!visible) return null;

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isResizing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const newRatio = (e.clientY - rect.top) / rect.height;
    setSplitRatio(Math.max(0.15, Math.min(0.85, newRatio)));
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  return (
    <div
      id="cad_dual_view_dock"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: 'var(--bg-surface)',
        border: isStandalone ? '1px solid var(--border-color)' : 'none',
        borderRadius: isStandalone ? '4px' : '0',
        overflow: 'hidden',
        position: 'relative',
        userSelect: isResizing ? 'none' : 'auto',
      }}
    >
      {/* Top Toolbar */}
      {isStandalone && (
        <div
          style={{
            padding: '6px 10px',
            background: 'var(--bg-grouped)',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>CAD Dual View (Cross Section & Plan)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => store.toggleCrossSection()}
                style={{
                  background: showCrossSection ? 'rgba(144, 175, 19, 0.2)' : 'transparent',
                  border: `1px solid ${showCrossSection ? 'var(--accent-osdag)' : 'var(--border-color)'}`,
                  color: showCrossSection ? 'var(--accent-osdag)' : 'var(--text-sub)',
                  borderRadius: '3px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Eye size={12} /> Cross Section
              </button>
              <button
                type="button"
                onClick={() => store.toggleTopView()}
                style={{
                  background: showTopView ? 'rgba(144, 175, 19, 0.2)' : 'transparent',
                  border: `1px solid ${showTopView ? 'var(--accent-osdag)' : 'var(--border-color)'}`,
                  color: showTopView ? 'var(--accent-osdag)' : 'var(--text-sub)',
                  borderRadius: '3px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Layers size={12} /> Plan View
              </button>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-sub)',
                padding: '2px',
                display: 'flex',
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      )}

      {/* Split Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Pane: Cross Section */}
        {showCrossSection && (
          <div
            style={{
              height: showTopView ? `${splitRatio * 100}%` : '100%',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <CadCrossSectionDock isStandalone={false} />
          </div>
        )}

        {/* Resizer Splitter Bar (mirrors desktop QSplitter handle) */}
        {showCrossSection && showTopView && (
          <div
            onMouseDown={handleMouseDown}
            style={{
              height: '5px',
              background: '#d0d0d0',
              cursor: 'row-resize',
              position: 'relative',
              zIndex: 20,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-osdag)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#d0d0d0')}
          />
        )}

        {/* Bottom Pane: Plan View */}
        {showTopView && (
          <div
            style={{
              height: showCrossSection ? `${(1 - splitRatio) * 100}%` : '100%',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <CadTopViewDock isStandalone={false} />
          </div>
        )}
      </div>
    </div>
  );
};
