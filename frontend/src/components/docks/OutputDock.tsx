import React from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { PercentBarWidget } from '../widgets/PercentBarWidget';
import { ChevronUp, ChevronDown, Table, FileText } from 'lucide-react';
import { getNoOfGirders } from '../../utils/bridgeInputs';

export const OutputDock: React.FC = () => {
  const {
    inputs,
    additionalInputs,
    isOutputDockCollapsed,
    toggleOutputDock,
    outputCollapsedSections,
    toggleOutputSection,
    analysisMember,
    setAnalysisMember,
    analysisLoadCase,
    setAnalysisLoadCase,
    analysisForce,
    setAnalysisForce,
    analysisDisplayOptions,
    toggleAnalysisDisplayOption,
    designMember,
    setDesignMember,
    designLoadCase,
    setDesignLoadCase,
    dcrValues,
    requireDesignCheck,
    setSteelDesignModalOpen,
    setTransverseDesignModalOpen,
    setDeckDesignModalOpen,
    setGenerateResultsModalOpen,
    setReportModalOpen
  } = useBridgeStore();

  const noOfGirders = getNoOfGirders(inputs, additionalInputs);
  const girderItems = Array.from({ length: noOfGirders }, (_, i) => `G${i + 1}`);

  const isSuperstructureCollapsed = Boolean(outputCollapsedSections['superstructure']);
  const isSubstructureCollapsed = Boolean(outputCollapsedSections['substructure']);

  return (
    <div className="osdag-output-dock" style={{
      display: 'flex',
      height: '100%',
      position: 'relative',
      zIndex: 10,
      flexShrink: 0
    }}>
      {isOutputDockCollapsed ? (
        /* ── OutputDockIndicator (mirrors desktop OutputDockIndicator) ── */
        <div className="osdag-dock-indicator osdag-dock-indicator--output">
          <div
            className="osdag-toggle-strip"
            onClick={toggleOutputDock}
            title="Show output panel"
          >
            <button
              type="button"
              className="osdag-toggle-strip__button"
              style={{ borderRadius: '3px 0 0 3px' }}
              onClick={(e) => {
                e.stopPropagation();
                toggleOutputDock();
              }}
              title="Show output panel"
            >
              ❮
            </button>
          </div>
          <img
            src="/vectors/outputs_label_light.svg"
            alt="Outputs"
            width={28}
            height={90}
            style={{ objectFit: 'contain', userSelect: 'none' }}
          />
        </div>
      ) : (
        <>
          {/* ── 1. Toggle Strip (_build_toggle_strip) on Left of Output Dock ── */}
          <div
            className="osdag-toggle-strip"
            onClick={toggleOutputDock}
            title="Hide output panel"
          >
            <button
              type="button"
              className="osdag-toggle-strip__button"
              style={{ borderRadius: '0 3px 3px 0' }}
              onClick={(e) => {
                e.stopPropagation();
                toggleOutputDock();
              }}
              title="Hide output panel"
            >
              ❯
            </button>
          </div>

          {/* ── 2. Content Container (Output Panel) ── */}
          <aside
            style={{
              width: '330px',
              minWidth: '330px',
              background: 'var(--bg-surface)',
              borderLeft: '1px solid var(--border-color)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div style={{
              padding: '12px 14px 10px 14px',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minWidth: '330px',
              boxSizing: 'border-box'
            }}>
          {/* ── Top Bar (_build_top_bar) ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <button
              type="button"
              style={{
                flex: 1,
                background: 'var(--accent-osdag)',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '13px',
                border: 'none',
                borderRadius: '4px',
                padding: '7px 20px',
                textAlign: 'center',
                cursor: 'default'
              }}
            >
              Output Dock
            </button>
          </div>

          {/* ── Scroll Area (_build_scroll_area) ── */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            borderTop: '1px solid var(--border-color)',
            borderBottom: '1px solid var(--border-color)',
            padding: '6px 4px 10px 2px'
          }}>
            {/* ── Section: Superstructure (Collapsible Card) ── */}
            <div style={{
              border: '1px solid var(--accent-osdag)',
              borderRadius: '5px',
              padding: '8px 10px 10px 10px',
              marginTop: '4px',
              background: 'var(--bg-surface)'
            }}>
              {/* Header with Title and Toggle Chevron */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  paddingBottom: isSuperstructureCollapsed ? '0' : '8px',
                  borderBottom: isSuperstructureCollapsed ? 'none' : '1px solid var(--border-subtle)'
                }}
                onClick={() => toggleOutputSection('superstructure')}
              >
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                  Superstructure
                </span>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-sub)',
                    padding: 0,
                    display: 'flex'
                  }}
                >
                  {isSuperstructureCollapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
                </button>
              </div>

              {!isSuperstructureCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                  {/* ── Subgroup 1: Girder Analysis Results ── */}
                  <div style={{
                    border: '1px solid var(--accent-osdag)',
                    borderRadius: '4px',
                    padding: '10px 8px 8px 8px',
                    position: 'relative',
                    marginTop: '8px'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-9px',
                      left: '8px',
                      background: 'var(--bg-surface)',
                      padding: '0 5px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase'
                    }}>
                      Girder Analysis Results
                    </div>

                    {/* Member Dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', marginTop: '2px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-main)', minWidth: '95px' }}>Member</label>
                      <select
                        value={analysisMember}
                        onChange={(e) => setAnalysisMember(e.target.value)}
                        style={{
                          flex: 1,
                          height: '28px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-main)',
                          fontSize: '12px',
                          padding: '0 6px'
                        }}
                      >
                        <option value="All">All</option>
                        {girderItems.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    {/* Load Case Dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-main)', minWidth: '95px', lineHeight: '1.2' }}>
                        Load Case /<br />Combination
                      </label>
                      <select
                        value={analysisLoadCase}
                        onChange={(e) => setAnalysisLoadCase(e.target.value)}
                        style={{
                          flex: 1,
                          height: '28px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-main)',
                          fontSize: '11px',
                          padding: '0 6px'
                        }}
                      >
                        <option value="1.35 DL + 1.5 LL">1.35 DL + 1.5 LL</option>
                        <option value="1.0 DL + 1.0 LL">1.0 DL + 1.0 LL</option>
                        <option value="0.9 DL + 1.5 LL">0.9 DL + 1.5 LL</option>
                        <option value="Design Envelope">Design Envelope</option>
                      </select>
                    </div>

                    {/* 3x3 Force Radio Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '4px',
                      padding: '6px 0',
                      borderTop: '1px solid var(--border-subtle)',
                      borderBottom: '1px solid var(--border-subtle)',
                      margin: '6px 0'
                    }}>
                      {[
                        [
                          { key: 'Fx', label: <span>F<sub>x</sub></span> },
                          { key: 'Vy', label: <span>V<sub>y</sub></span> },
                          { key: 'Vz', label: <span>V<sub>z</sub></span> }
                        ],
                        [
                          { key: 'Tx', label: <span>T<sub>x</sub></span> },
                          { key: 'My', label: <span>M<sub>y</sub></span> },
                          { key: 'Mz', label: <span>M<sub>z</sub></span> }
                        ],
                        [
                          { key: 'Dx', label: <span>D<sub>x</sub></span> },
                          { key: 'Dy', label: <span>D<sub>y</sub></span> },
                          { key: 'Dz', label: <span>D<sub>z</sub></span> }
                        ]
                      ].map((col, cIdx) => (
                        <div key={cIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          {col.map((item) => (
                            <label
                              key={item.key}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                userSelect: 'none',
                                width: '100%',
                                justifyContent: 'center',
                                padding: '2px 0'
                              }}
                            >
                              <input
                                type="radio"
                                name="force_radio_grid"
                                checked={analysisForce === item.key}
                                onChange={() => setAnalysisForce(item.key)}
                                style={{ accentColor: 'var(--accent-osdag)', cursor: 'pointer' }}
                              />
                              <span style={{ fontWeight: analysisForce === item.key ? 700 : 500 }}>
                                {item.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Subgroup: Display Values */}
                    <div style={{
                      border: '1px solid var(--accent-osdag)',
                      borderRadius: '4px',
                      padding: '6px 8px',
                      marginTop: '6px'
                    }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Display Values
                      </div>
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '4px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(analysisDisplayOptions.Max)}
                            onChange={() => toggleAnalysisDisplayOption('Max')}
                            style={{ accentColor: 'var(--accent-osdag)', cursor: 'pointer' }}
                          />
                          <span>Max</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(analysisDisplayOptions.Min)}
                            onChange={() => toggleAnalysisDisplayOption('Min')}
                            style={{ accentColor: 'var(--accent-osdag)', cursor: 'pointer' }}
                          />
                          <span>Min</span>
                        </label>
                      </div>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(analysisDisplayOptions.All)}
                            onChange={() => toggleAnalysisDisplayOption('All')}
                            style={{ accentColor: 'var(--accent-osdag)', cursor: 'pointer' }}
                          />
                          <span>All</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(analysisDisplayOptions.Summary)}
                            onChange={() => toggleAnalysisDisplayOption('Summary')}
                            style={{ accentColor: 'var(--accent-osdag)', cursor: 'pointer' }}
                          />
                          <span>Summary</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* ── Subgroup 2: Girder Design (Percentage Bars) ── */}
                  <div style={{
                    border: '1px solid var(--accent-osdag)',
                    borderRadius: '4px',
                    padding: '10px 8px 8px 8px',
                    position: 'relative',
                    marginTop: '8px'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-9px',
                      left: '8px',
                      background: 'var(--bg-surface)',
                      padding: '0 5px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase'
                    }}>
                      Girder Design
                    </div>

                    {/* Member Dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', marginTop: '2px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-main)', minWidth: '95px' }}>Member</label>
                      <select
                        value={designMember}
                        onChange={(e) => setDesignMember(e.target.value)}
                        style={{
                          flex: 1,
                          height: '28px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-main)',
                          fontSize: '12px',
                          padding: '0 6px'
                        }}
                      >
                        {girderItems.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    {/* Load Case Dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-main)', minWidth: '95px', lineHeight: '1.2' }}>
                        Load Case /<br />Combination
                      </label>
                      <select
                        value={designLoadCase}
                        onChange={(e) => setDesignLoadCase(e.target.value)}
                        style={{
                          flex: 1,
                          height: '28px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-main)',
                          fontSize: '11px',
                          padding: '0 6px'
                        }}
                      >
                        <option value="Design Envelope">Design Envelope</option>
                        <option value="1.35 DL + 1.5 LL">1.35 DL + 1.5 LL</option>
                        <option value="1.0 DL + 1.0 LL">1.0 DL + 1.0 LL</option>
                      </select>
                    </div>

                    {/* Percentage Bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '10px' }}>
                      <PercentBarWidget label="Strength Limit State (Flexure)" value={dcrValues.flexure} />
                      <PercentBarWidget label="Strength Limit State (Shear)" value={dcrValues.shear} />
                      <PercentBarWidget label="Interaction" value={dcrValues.interaction} />
                      <PercentBarWidget label="Lateral Torsional Buckling" value={dcrValues.ltb} />
                      <PercentBarWidget label="Resistance to Longitudinal Shear" value={dcrValues.longTransShear} />
                      <PercentBarWidget label="Resistance to Fatigue" value={dcrValues.fatigue} />
                      <PercentBarWidget label="Stress Limitation" value={dcrValues.stressLimitation} />
                      <PercentBarWidget label="Deflection" value={dcrValues.deflection} />
                    </div>

                    {/* Analysis and Design Summary Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!requireDesignCheck()) return;
                        setSteelDesignModalOpen(true);
                      }}
                      style={{
                        width: '100%',
                        background: 'var(--accent-osdag)',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7a9a12'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-osdag)'}
                    >
                      Analysis and Design Summary
                    </button>
                  </div>

                  {/* ── Subgroup 3: Transverse Design ── */}
                  <div style={{
                    border: '1px solid var(--accent-osdag)',
                    borderRadius: '4px',
                    padding: '10px 8px 8px 8px',
                    position: 'relative',
                    marginTop: '8px'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-9px',
                      left: '8px',
                      background: 'var(--bg-surface)',
                      padding: '0 5px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase'
                    }}>
                      Transverse Design
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!requireDesignCheck()) return;
                        setTransverseDesignModalOpen(true);
                      }}
                      style={{
                        width: '100%',
                        background: 'var(--accent-osdag)',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        marginTop: '2px',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7a9a12'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-osdag)'}
                    >
                      Design Summary
                    </button>
                  </div>

                  {/* ── Subgroup 4: Deck Design ── */}
                  <div style={{
                    border: '1px solid var(--accent-osdag)',
                    borderRadius: '4px',
                    padding: '10px 8px 8px 8px',
                    position: 'relative',
                    marginTop: '8px'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-9px',
                      left: '8px',
                      background: 'var(--bg-surface)',
                      padding: '0 5px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase'
                    }}>
                      Deck Design
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!requireDesignCheck()) return;
                        setDeckDesignModalOpen(true);
                      }}
                      style={{
                        width: '100%',
                        background: 'var(--accent-osdag)',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        marginTop: '2px',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7a9a12'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-osdag)'}
                    >
                      Design Summary
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Section: Substructure (Collapsible Card) ── */}
            <div style={{
              border: '1px solid var(--accent-osdag)',
              borderRadius: '5px',
              padding: '8px 10px 10px 10px',
              marginTop: '10px',
              background: 'var(--bg-surface)'
            }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  paddingBottom: isSubstructureCollapsed ? '0' : '8px',
                  borderBottom: isSubstructureCollapsed ? 'none' : '1px solid var(--border-subtle)'
                }}
                onClick={() => toggleOutputSection('substructure')}
              >
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                  Substructure
                </span>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-sub)',
                    padding: 0,
                    display: 'flex'
                  }}
                >
                  {isSubstructureCollapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
                </button>
              </div>

              {!isSubstructureCollapsed && (
                <div style={{ padding: '10px 4px', fontSize: '11px', color: 'var(--text-sub)', fontStyle: 'italic' }}>
                  Substructure modules will activate when substructure geometry is configured.
                </div>
              )}
            </div>
          </div>

          {/* ── Bottom Action Buttons (_build_bottom_buttons) ── */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '12px',
            paddingTop: '2px'
          }}>
            {/* Generate Results Table Button (DockCustomButton) */}
            <button
              type="button"
              onClick={() => {
                if (!requireDesignCheck()) return;
                setGenerateResultsModalOpen(true);
              }}
              className="dock-custom-button"
              style={{ flex: 1, padding: '8px 8px' }}
            >
              <img src="/vectors/design_result_table.svg" alt="" width={18} height={18} />
              <span>Results Table</span>
            </button>

            {/* Generate Report Button (DockCustomButton) */}
            <button
              type="button"
              onClick={() => {
                if (!requireDesignCheck()) return;
                setReportModalOpen(true);
              }}
              className="dock-custom-button"
              style={{ flex: 1, padding: '8px 8px' }}
            >
              <img src="/vectors/design_report.svg" alt="" width={18} height={18} />
              <span>Create Report</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )}
</div>
  );
};
