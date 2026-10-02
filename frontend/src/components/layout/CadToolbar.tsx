import React from 'react';
import { useBridgeStore, type CadDisplayState } from '../../store/useBridgeStore';

const TB = '/vectors/tool_bar';

type ToggleKey = keyof CadDisplayState;

interface ToggleDef {
  key: ToggleKey;
  icon: string;
  tooltip: string;
}

const TOGGLE_NODE_GROUP: ToggleDef[] = [
  { key: 'nodes', icon: `${TB}/node_light.svg`, tooltip: 'Node' },
  { key: 'nodeNumbers', icon: `${TB}/Node_Number.svg`, tooltip: 'Node Number' },
  { key: 'elementNumbers', icon: `${TB}/Element_number.svg`, tooltip: 'Element Number' },
];

export const CadToolbar: React.FC = () => {
  const {
    activeViewportTab,
    activeNavTool,
    setActiveNavTool,
    cadDisplay,
    toggleCadDisplay,
    cadZoom,
    setCadZoom,
    zoomIn,
    zoomOut,
    zoomFit,
  } = useBridgeStore();

  const is3D = activeViewportTab === '3d';

  const btnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '26px',
    height: '24px',
    padding: 0,
    border: '1px solid transparent',
    borderRadius: '4px',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  };

  const renderToggle = ({ key, icon, tooltip }: ToggleDef) => {
    const active = cadDisplay[key];
    return (
      <button
        key={key}
        type="button"
        title={tooltip}
        aria-label={tooltip}
        aria-pressed={active}
        onClick={() => toggleCadDisplay(key)}
        style={{
          ...btnStyle,
          background: active ? 'rgba(130, 130, 130, 0.45)' : 'transparent',
          border: active ? '1px solid rgba(130, 130, 130, 0.6)' : '1px solid transparent',
        }}
      >
        <img src={icon} alt="" width={20} height={20} />
      </button>
    );
  };

  const separator = (key: string) => (
    <span
      key={key}
      aria-hidden="true"
      style={{ width: '1px', height: '20px', background: '#999999', margin: '0 6px' }}
    />
  );

  return (
    <div
      className="osdag-cad-toolbar"
      role="toolbar"
      aria-label="CAD tools"
      style={{
        height: '30px',
        minHeight: '30px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '0 8px',
        borderTop: '1px solid var(--border-color, #909090)',
        borderBottom: '1px solid var(--border-color, #909090)',
        background: 'var(--bg-surface)',
        overflowX: 'auto',
        overflowY: 'hidden',
        flexWrap: 'nowrap',
        userSelect: 'none',
      }}
    >
      {/* Zoom Actions */}
      <button type="button" title="Zoom Fit" aria-label="Zoom Fit" onClick={zoomFit} style={btnStyle}>
        <img src={`${TB}/zoom_fit_light.svg`} alt="" width={20} height={20} />
      </button>
      <button
        type="button"
        title="Zoom Window"
        aria-label="Zoom Window"
        aria-pressed={activeNavTool === 'zoom_window'}
        onClick={() => setActiveNavTool(activeNavTool === 'zoom_window' ? 'rotate' : 'zoom_window')}
        style={{
          ...btnStyle,
          background: activeNavTool === 'zoom_window' ? 'rgba(130, 130, 130, 0.45)' : 'transparent',
          border: activeNavTool === 'zoom_window' ? '1px solid rgba(130, 130, 130, 0.6)' : '1px solid transparent',
        }}
      >
        <img src={`${TB}/zoom_window_light.svg`} alt="" width={20} height={20} />
      </button>
      <button type="button" title="Zoom In" aria-label="Zoom In" onClick={zoomIn} style={btnStyle}>
        <img src={`${TB}/zoom_in_light.svg`} alt="" width={20} height={20} />
      </button>
      <button type="button" title="Zoom Out" aria-label="Zoom Out" onClick={zoomOut} style={btnStyle}>
        <img src={`${TB}/zoom_out_light.svg`} alt="" width={20} height={20} />
      </button>

      {separator('sep-nav')}

      {/* Navigation Toggles (Pan & Rotate) */}
      <button
        type="button"
        title="Pan"
        aria-label="Pan"
        aria-pressed={activeNavTool === 'pan'}
        onClick={() => setActiveNavTool(activeNavTool === 'pan' ? 'rotate' : 'pan')}
        style={{
          ...btnStyle,
          background: activeNavTool === 'pan' ? 'rgba(130, 130, 130, 0.45)' : 'transparent',
          border: activeNavTool === 'pan' ? '1px solid rgba(130, 130, 130, 0.6)' : '1px solid transparent',
        }}
      >
        <img src={`${TB}/pan_light.svg`} alt="" width={20} height={20} />
      </button>
      <button
        type="button"
        title="Rotate"
        aria-label="Rotate"
        aria-pressed={activeNavTool === 'rotate'}
        onClick={() => setActiveNavTool('rotate')}
        style={{
          ...btnStyle,
          background: activeNavTool === 'rotate' ? 'rgba(130, 130, 130, 0.45)' : 'transparent',
          border: activeNavTool === 'rotate' ? '1px solid rgba(130, 130, 130, 0.6)' : '1px solid transparent',
        }}
      >
        <img src={`${TB}/rotate_light.svg`} alt="" width={20} height={20} />
      </button>

      {separator('sep-node')}

      {/* Node & Analysis Overlays */}
      {TOGGLE_NODE_GROUP.map(renderToggle)}

      {separator('sep-model')}

      {/* Grillage View (Toggle) */}
      <button
        type="button"
        title="Grillage View"
        aria-label="Grillage View"
        aria-pressed={cadDisplay.grillageView}
        onClick={() => toggleCadDisplay('grillageView')}
        style={{
          ...btnStyle,
          background: cadDisplay.grillageView ? 'rgba(130, 130, 130, 0.45)' : 'transparent',
          border: cadDisplay.grillageView ? '1px solid rgba(130, 130, 130, 0.6)' : '1px solid transparent',
        }}
      >
        <img src={`${TB}/grillage_view_light.svg`} alt="" width={20} height={20} />
      </button>

      {/* Axis Triad */}
      {renderToggle({ key: 'axis', icon: `${TB}/show_axis_light.svg`, tooltip: 'Axis' })}

      {/* Legends / Info Table (CAD 3D only) */}
      {is3D && renderToggle({ key: 'legend', icon: `${TB}/legend_icon.svg`, tooltip: 'Legends' })}

      {/* Plots-Only Controls (hidden in 3D CAD mode matching desktop _hide_plots_only_widgets) */}
      {!is3D && (
        <>
          {separator('sep-plots')}
          {renderToggle({ key: 'gridLines', icon: `${TB}/show_grid_lines_light.svg`, tooltip: 'Grid Lines' })}
          {renderToggle({ key: 'supports', icon: `${TB}/show_support_light.svg`, tooltip: 'Supports' })}
          {renderToggle({ key: 'loads', icon: `${TB}/show_load_light.svg`, tooltip: 'Loads' })}
          {renderToggle({ key: 'girderLabels', icon: `${TB}/Girder_label.svg`, tooltip: 'Girder Labels' })}
          {separator('sep-scale')}
          <span style={{ fontSize: '12px', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Scale:</span>
          <input
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={cadZoom}
            onChange={(e) => setCadZoom(Number(e.target.value))}
            title="Display scale"
            aria-label="Display scale"
            style={{
              width: '64px',
              height: '22px',
              border: '1px solid #aaa',
              borderRadius: '4px',
              background: 'var(--input-bg)',
              color: 'var(--text-main)',
              fontSize: '12px',
              padding: '0 6px',
            }}
          />
        </>
      )}

      <span style={{ flex: 1 }} />
    </div>
  );
};
