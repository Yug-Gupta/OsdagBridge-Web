import React, { useState } from 'react';
import { LineChart } from 'lucide-react';
import { useBridgeStore } from '../../store/useBridgeStore';

/**
 * Web counterpart of osdagbridge.desktop.ui.mpl_plot_widget.MplPlotWidget.
 *
 * The desktop plots widget renders Matplotlib result graphs (bending moment,
 * shear, deflection envelopes) for the selected load case. The web build keeps
 * the same toolbar contract (engineering scale + load-case selection) and
 * renders the result envelopes when design results are available.
 */
export const PlotsView: React.FC = () => {
  const { designRan, analysisLoadCase, setAnalysisLoadCase } = useBridgeStore();
  const [engineeringScale, setEngineeringScale] = useState(1.0);

  return (
    <div
      className="osdag-plots-view"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-viewport)',
      }}
    >
      {!designRan ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: 'var(--text-sub)',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <LineChart size={34} color="var(--accent-osdag)" aria-hidden="true" />
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
            Result Plots
          </div>
          <div style={{ fontSize: '12px', maxWidth: '360px' }}>
            Bending moment, shear force and deflection envelopes will be plotted here
            once the design has been run.
          </div>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-sub)',
            fontSize: '12px',
          }}
        >
          Plotting result envelopes for {analysisLoadCase} (engineering scale ×
          {engineeringScale.toFixed(2)})…
        </div>
      )}

      <div
        style={{
          height: '30px',
          minHeight: '30px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0 10px',
          fontSize: '12px',
          color: 'var(--text-main)',
          background: 'var(--bg-surface)',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          Load Case
          <select
            value={analysisLoadCase}
            onChange={(e) => setAnalysisLoadCase(e.target.value)}
            style={{
              height: '22px',
              border: '1px solid var(--border-color)',
              borderRadius: '3px',
              background: 'var(--input-bg)',
              color: 'var(--text-main)',
              fontSize: '11px',
              padding: '0 4px',
            }}
          >
            <option value="Design Envelope">Design Envelope</option>
            <option value="1.35 DL + 1.5 LL">1.35 DL + 1.5 LL</option>
            <option value="1.0 DL + 1.0 LL">1.0 DL + 1.0 LL</option>
          </select>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          Scale
          <input
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={engineeringScale}
            onChange={(e) => setEngineeringScale(Number(e.target.value))}
            style={{
              width: '64px',
              height: '22px',
              border: '1px solid var(--border-color)',
              borderRadius: '3px',
              background: 'var(--input-bg)',
              color: 'var(--text-main)',
              fontSize: '11px',
              padding: '0 4px',
            }}
          />
        </label>
      </div>
    </div>
  );
};
