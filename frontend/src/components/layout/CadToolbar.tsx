import React from 'react';
import { useBridgeStore, type CadDisplayState } from '../../store/useBridgeStore';

const TB = '/vectors/tool_bar';

type ToggleKey = keyof CadDisplayState;

interface ToggleDef {
  key: ToggleKey;
  icon: string;
  tooltip: string;
}

const NAV_GROUP: { key: 'pan' | 'rotate'; icon: string; tooltip: string }[] = [
  { key: 'pan', icon: `${TB}/pan_light.svg`, tooltip: 'Pan' },
  { key: 'rotate', icon: `${TB}/rotate_light.svg`, tooltip: 'Rotate' },
];

const TOGGLE_GROUP: ToggleDef[] = [
  { key: 'nodes', icon: `${TB}/node_light.svg`, tooltip: 'Node' },
  { key: 'nodeNumbers', icon: `${TB}/Node_Number.svg`, tooltip: 'Node Number' },
  { key: 'elementNumbers', icon: `${TB}/Element_number.svg`, tooltip: 'Element Number' },
];

const DISPLAY_GROUP: ToggleDef[] = [
  { key: 'axis', icon: `${TB}/show_axis_light.svg`, tooltip: 'Axis' },
  { key: 'legend', icon: `${TB}/legend_icon.svg`, tooltip: 'Legends' },
  { key: 'gridLines', icon: `${TB}/show_grid_lines_light.svg`, tooltip: 'Grid Lines' },
  { key: 'supports', icon: `${TB}/show_support_light.svg`, tooltip: 'Supports' },
  { key: 'loads', icon: `${TB}/show_load_light.svg`, tooltip: 'Loads' },
  { key: 'girderLabels', icon: `${TB}/Girder_label.svg`, tooltip: 'Girder Labels' },
];

export const CadToolbar: React.FC = () => {
  const {
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

  const btnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    padding: 0,
    border: '1px solid transparent',
    borderRadius: '4px',
    background: 'transparent',
    cursor: 'pointer',
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
          background: active ? '#1565C0' : 'transparent',
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
      style={{ width: '1px', height: '24px', background: '#999999', margin: '0 10px' }}
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
        gap: '6px',
        padding: '0 5px',
        borderTop: '1px solid #909090',
        borderBottom: '1px solid #909090',
        background: 'var(--bg-surface)',
        overflowX: 'auto',
        overflowY: 'hidden',
        flexWrap: 'nowrap',
      }}
    >
      {/* Zoom group */}
      <button type="button" title="Zoom Fit" aria-label="Zoom Fit" onClick={zoomFit} style={btnStyle}>
        <img src={`${TB}/zoom_fit_light.svg`} alt="" width={20} height={20} />
      </button>
      <button type="button" title="Zoom Window" aria-label="Zoom Window" onClick={zoomFit} style={btnStyle}>
        <img src={`${TB}/zoom_window_light.svg`} alt="" width={20} height={20} />
      </button>
      <button type="button" title="Zoom In" aria-label="Zoom In" onClick={zoomIn} style={btnStyle}>
        <img src={`${TB}/zoom_in_light.svg`} alt="" width={20} height={20} />
      </button>
      <button type="button" title="Zoom Out" aria-label="Zoom Out" onClick={zoomOut} style={btnStyle}>
        <img src={`${TB}/zoom_out_light.svg`} alt="" width={20} height={20} />
      </button>

      {separator('sep-nav')}

      {/* Navigation group */}
      {NAV_GROUP.map(({ key, icon, tooltip }) => {
        const active = activeNavTool === key;
        return (
          <button
            key={key}
            type="button"
            title={tooltip}
            aria-label={tooltip}
            aria-pressed={active}
            onClick={() => setActiveNavTool(key)}
            style={{ ...btnStyle, background: active ? '#1565C0' : 'transparent' }}
          >
            <img src={icon} alt="" width={20} height={20} />
          </button>
        );
      })}

      {separator('sep-node')}

      {/* Node group */}
      {TOGGLE_GROUP.map(renderToggle)}

      {separator('sep-model')}

      {/* Model display group */}
      <button type="button" title="Grillage View" aria-label="Grillage View" style={btnStyle}>
        <img src={`${TB}/grillage_view_light.svg`} alt="" width={20} height={20} />
      </button>
      {DISPLAY_GROUP.map(renderToggle)}

      {separator('sep-scale')}

      {/* Scale */}
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
          width: '74px',
          height: '22px',
          border: '1px solid #aaa',
          borderRadius: '4px',
          background: 'var(--input-bg)',
          color: 'var(--text-main)',
          fontSize: '12px',
          padding: '0 6px',
        }}
      />
      <span style={{ flex: 1 }} />
    </div>
  );
};
