import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { Eye, Layers, Box, EyeOff, Columns, LineChart } from 'lucide-react';
import { CadCrossSectionDock } from '../docks/CadCrossSectionDock';
import { CadTopViewDock } from '../docks/CadTopViewDock';
import { CadDualViewDock } from '../docks/CadDualViewDock';
import { PlotsView } from './PlotsView';
import { CadToolbar } from '../layout/CadToolbar';
import { fetch3dCadParameters } from '../../services/api';
import type { BridgeCadParameters } from '../../types/bridgeGeometry';

const BridgeViewer = lazy(() =>
  import('./BridgeViewer').then((module) => ({ default: module.BridgeViewer }))
);

export const ViewportContainer: React.FC = () => {
  const {
    activeViewportTab,
    setActiveViewportTab,
    inputs,
    showDeck,
    toggleDeck,
    darkMode,
    cadDisplay,
    cadZoom,
    activeNavTool,
    additionalInputs,
  } = useBridgeStore();

  // 3D CAD parameters (backend, mock fallback). Debounced so typing in the
  // input dock does not hammer the endpoint once it is live.
  const [cadParams, setCadParams] = useState<BridgeCadParameters | null>(null);
  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(() => {
      fetch3dCadParameters(inputs, additionalInputs)
        .then((p) => {
          if (!cancelled) setCadParams(p);
        })
        .catch(() => {
          /* fetch3dCadParameters falls back to the local mock */
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [inputs, additionalInputs]);

  const tabStyle = (tab: string) => ({
    background: activeViewportTab === tab ? 'var(--tab-active-bg)' : 'transparent',
    border: activeViewportTab === tab ? '1px solid var(--border-color)' : '1px solid transparent',
    borderBottom: activeViewportTab === tab ? '1px solid var(--tab-active-bg)' : '1px solid transparent',
    padding: '4px 10px',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: activeViewportTab === tab ? 600 : 400,
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '6px',
    color: activeViewportTab === tab ? 'var(--accent-osdag)' : 'var(--text-sub)',
  });

  const is3D = activeViewportTab === '3d';
  const isPlots = activeViewportTab === 'plots';

  return (
    <div className="viewport-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-viewport)', position: 'relative', minHeight: 0 }}>
      {/* Desktop CAD toolbar (ToolBarWidget) — visible only for 3D CAD and Plots views (mirrors template_page.py lines 424-430) */}
      {(is3D || isPlots) && <CadToolbar />}

      {/* Drawing Viewport Area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', justifyContent: 'stretch', padding: 0, background: 'var(--bg-viewport)', overflow: 'hidden', position: 'relative' }}>
        {/* 2D CAD Area (Dual / Cross Section / Top View) */}
        {!is3D && !isPlots && (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <CadDualViewDock isStandalone={false} />
          </div>
        )}

        {/* Plots View */}
        {isPlots && (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <PlotsView />
          </div>
        )}

        {activeViewportTab === '3d' && (
          <div style={{ width: '100%', height: '100%', position: 'relative' }} role="img" aria-label="Interactive 3D plate girder bridge. Rotate, pan, and zoom the model. Deck visibility can be toggled from the toolbar.">
            <Suspense fallback={
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '48px' }}>
                <Box size={32} color="var(--accent-osdag)" style={{ margin: '0 auto 8px', display: 'block' }} aria-hidden="true" />
                <div style={{ fontSize: '12px' }}>Loading 3D Viewer...</div>
              </div>
            }>
              {cadParams && (
                <BridgeViewer
                  params={cadParams}
                  showDeck={showDeck}
                  darkMode={darkMode}
                  cadDisplay={cadDisplay}
                  cadZoom={cadZoom}
                  activeNavTool={activeNavTool}
                />
              )}
            </Suspense>
            <div
              style={{
                position: 'absolute',
                left: 10,
                bottom: 10,
                padding: '5px 8px',
                borderRadius: '4px',
                background: 'rgba(15, 23, 42, 0.72)',
                color: '#e2e8f0',
                fontSize: '10px',
                letterSpacing: '0.02em',
                pointerEvents: 'none',
              }}
            >
              Left-drag rotate · Right-drag pan · Scroll zoom
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
