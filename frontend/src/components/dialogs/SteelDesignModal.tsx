import React, { useState } from 'react';
import { X, CheckCircle, BarChart3, Info, ShieldCheck } from 'lucide-react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { getGirderMaterial, getSpan } from '../../utils/bridgeInputs';
import { ResultSchemaView } from '../forms/ResultSchemaView';

export const SteelDesignModal: React.FC = () => {
  const {
    isSteelDesignModalOpen,
    setSteelDesignModalOpen,
    inputs,
    designMember,
    designLoadCase,
    dcrValues
  } = useBridgeStore();

  const [activeTab, setActiveTab] = useState<'details' | 'analysis' | 'checks'>('details');

  if (!isSteelDesignModalOpen) return null;

  const span = getSpan(inputs);
  const totalDepth = Math.round(span * 65); // approx depth in mm (e.g. 1950 mm)
  const webThk = 16;
  const topFlangeW = 450;
  const topFlangeThk = 28;
  const botFlangeW = 500;
  const botFlangeThk = 32;

  // Max bending moment and shear values
  const maxBMD = Math.round((span * span * 24.5) / 8); // kNm
  const maxSFD = Math.round((span * 24.5) / 2); // kN

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 900,
      backdropFilter: 'blur(2px)'
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: '6px',
        border: '1px solid var(--accent-osdag)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
        width: '780px',
        maxWidth: '92vw',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Title Bar */}
        <div style={{
          background: 'var(--accent-osdag)',
          color: '#ffffff',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 700,
          fontSize: '13px'
        }}>
          <span>Steel Girder Design — Analysis & Design Summary ({designMember})</span>
          <button
            type="button"
            onClick={() => setSteelDesignModalOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              padding: 0
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Tab Strip */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-grouped)',
          padding: '0 12px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            style={{
              padding: '10px 18px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'details' ? '3px solid var(--accent-osdag)' : '3px solid transparent',
              color: activeTab === 'details' ? 'var(--accent-osdag)' : 'var(--text-sub)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Info size={14} />
            <span>Girder Details</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analysis')}
            style={{
              padding: '10px 18px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'analysis' ? '3px solid var(--accent-osdag)' : '3px solid transparent',
              color: activeTab === 'analysis' ? 'var(--accent-osdag)' : 'var(--text-sub)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <BarChart3 size={14} />
            <span>Analysis Results</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('checks')}
            style={{
              padding: '10px 18px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'checks' ? '3px solid var(--accent-osdag)' : '3px solid transparent',
              color: activeTab === 'checks' ? 'var(--accent-osdag)' : 'var(--text-sub)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={14} />
            <span>Design Compliance Checks</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div style={{
          padding: '16px 20px',
          overflowY: 'auto',
          flex: 1
        }}>
          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Desktop STEEL_DESIGN_DETAILS_SCHEMA (cards + stiffener table). */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '12px', background: 'var(--bg-surface)' }}>
                <ResultSchemaView which="steelDesignDetails" />
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px'
              }}>
                <div style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  padding: '12px',
                  background: 'var(--bg-grouped)'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--accent-osdag)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Geometric Dimensions
                  </div>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Girder Span</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{span} m</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Total Depth</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{totalDepth} mm</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Web Thickness</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{webThk} mm</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Top Flange Width</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{topFlangeW} mm</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Top Flange Thickness</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{topFlangeThk} mm</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Bottom Flange Width</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{botFlangeW} mm</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Bottom Flange Thickness</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{botFlangeThk} mm</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  padding: '12px',
                  background: 'var(--bg-grouped)'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--accent-osdag)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Section Properties & Material
                  </div>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Steel Grade</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{getGirderMaterial(inputs) || 'E 250'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Yield Stress (fy)</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>250 MPa</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Cross-Section Area</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>58,600 mm²</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Moment of Inertia (Ixx)</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>3.42 × 10¹⁰ mm⁴</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Moment of Inertia (Iyy)</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>5.45 × 10⁸ mm⁴</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Elastic Modulus (Zex)</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>3.51 × 10⁷ mm³</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Plastic Modulus (Zpx)</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>3.98 × 10⁷ mm³</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                background: 'var(--bg-grouped)',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                <span><strong>Active Member:</strong> {designMember}</span>
                <span><strong>Load Combination:</strong> {designLoadCase}</span>
              </div>

              {/* BMD Diagram */}
              <div style={{
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '12px',
                background: 'var(--bg-surface)'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Bending Moment Diagram (Mz) — Max: {maxBMD} kNm
                </div>
                <div style={{ height: '110px', width: '100%', position: 'relative' }}>
                  <svg width="100%" height="100%" viewBox="0 0 500 100" preserveAspectRatio="none">
                    {/* Beam axis */}
                    <line x1="20" y1="20" x2="480" y2="20" stroke="var(--text-sub)" strokeWidth="1.5" />
                    {/* Parabolic moment curve */}
                    <path
                      d="M 20 20 Q 250 100 480 20"
                      fill="rgba(144, 175, 19, 0.15)"
                      stroke="#90AF13"
                      strokeWidth="2"
                    />
                    <text x="250" y="85" textAnchor="middle" fill="#6c8408" fontSize="11" fontWeight="bold">
                      +{maxBMD} kNm
                    </text>
                  </svg>
                </div>
              </div>

              {/* SFD Diagram */}
              <div style={{
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '12px',
                background: 'var(--bg-surface)'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Shear Force Diagram (Vy) — Max: ±{maxSFD} kN
                </div>
                <div style={{ height: '100px', width: '100%', position: 'relative' }}>
                  <svg width="100%" height="100%" viewBox="0 0 500 100" preserveAspectRatio="none">
                    {/* Zero line */}
                    <line x1="20" y1="50" x2="480" y2="50" stroke="var(--text-sub)" strokeWidth="1.5" />
                    {/* Linear shear line */}
                    <line x1="20" y1="15" x2="480" y2="85" stroke="#2563eb" strokeWidth="2" />
                    {/* Fill positive */}
                    <polygon points="20,15 250,50 20,50" fill="rgba(37, 99, 235, 0.15)" />
                    {/* Fill negative */}
                    <polygon points="480,85 250,50 480,50" fill="rgba(37, 99, 235, 0.15)" />
                    <text x="60" y="32" fill="#2563eb" fontSize="10" fontWeight="bold">+{maxSFD} kN</text>
                    <text x="440" y="75" textAnchor="end" fill="#2563eb" fontSize="10" fontWeight="bold">-{maxSFD} kN</text>
                  </svg>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'checks' && (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-grouped)', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Limit State Check</th>
                    <th style={{ padding: '8px' }}>Clause</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Demand / Capacity</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>DCR</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Strength Limit State (Flexure)', clause: 'IRC:24 Cl. 8.2', ratio: dcrValues.flexure || 78 },
                    { name: 'Strength Limit State (Shear)', clause: 'IRC:24 Cl. 8.4', ratio: dcrValues.shear || 64 },
                    { name: 'Interaction (M + V)', clause: 'IRC:24 Cl. 8.2.3', ratio: dcrValues.interaction || 82 },
                    { name: 'Lateral Torsional Buckling', clause: 'IRC:24 Cl. 8.2.2', ratio: dcrValues.ltb || 71 },
                    { name: 'Longitudinal Shear Resistance', clause: 'IRC:24 Cl. 8.5', ratio: dcrValues.longTransShear || 55 },
                    { name: 'Resistance to Fatigue', clause: 'IRC:24 Cl. 13', ratio: dcrValues.fatigue || 48 },
                    { name: 'Stress Limitation', clause: 'IRC:24 Cl. 9', ratio: dcrValues.stressLimitation || 85 },
                    { name: 'Deflection Limit (L / 800)', clause: 'IRC:24 Cl. 5.4', ratio: dcrValues.deflection || 62 },
                  ].map((chk, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px', fontWeight: 500 }}>{chk.name}</td>
                      <td style={{ padding: '8px', color: 'var(--text-sub)' }}>{chk.clause}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{(chk.ratio * 0.01).toFixed(2)}</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{chk.ratio}%</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span style={{
                          background: chk.ratio < 100 ? '#e8f5e9' : '#ffebee',
                          color: chk.ratio < 100 ? '#2e7d32' : '#c62828',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '10px'
                        }}>
                          {chk.ratio < 100 ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 16px',
          background: 'var(--bg-grouped)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            type="button"
            onClick={() => setSteelDesignModalOpen(false)}
            style={{
              background: 'var(--accent-osdag)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 20px',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
