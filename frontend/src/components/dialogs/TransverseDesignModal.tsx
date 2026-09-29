import React, { useState } from 'react';
import { X, Layers, CheckCircle } from 'lucide-react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { ResultSchemaView } from '../forms/ResultSchemaView';

export const TransverseDesignModal: React.FC = () => {
  const { isTransverseDesignModalOpen, setTransverseDesignModalOpen } = useBridgeStore();
  const [activeTab, setActiveTab] = useState<'bracing' | 'diaphragm'>('bracing');

  if (!isTransverseDesignModalOpen) return null;

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
        width: '740px',
        maxWidth: '92vw',
        maxHeight: '85vh',
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
          <span>Transverse Member Design — Summary</span>
          <button
            type="button"
            onClick={() => setTransverseDesignModalOpen(false)}
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
            onClick={() => setActiveTab('bracing')}
            style={{
              padding: '10px 18px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'bracing' ? '3px solid var(--accent-osdag)' : '3px solid transparent',
              color: activeTab === 'bracing' ? 'var(--accent-osdag)' : 'var(--text-sub)',
              cursor: 'pointer'
            }}
          >
            Cross Bracing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diaphragm')}
            style={{
              padding: '10px 18px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'diaphragm' ? '3px solid var(--accent-osdag)' : '3px solid transparent',
              color: activeTab === 'diaphragm' ? 'var(--accent-osdag)' : 'var(--text-sub)',
              cursor: 'pointer'
            }}
          >
            End Diaphragm
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {/* Desktop TRANSVERSE_MEMBER_DESIGN_SCHEMA. */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '12px', background: 'var(--bg-surface)', marginBottom: '14px' }}>
            <ResultSchemaView which="transverseMemberDesign" />
          </div>
          {activeTab === 'bracing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                    Member Configuration
                  </div>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Bracing Type</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>X-Type with Chords</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Bracing Section</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>ISA 90 × 90 × 8 mm</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Top Chord Section</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>ISA 75 × 75 × 6 mm</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Bottom Chord Section</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>ISA 75 × 75 × 6 mm</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Frame Spacing</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>4.5 m c/c</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Number of Bays</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>7 Bays</td>
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
                    Design Compliance
                  </div>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Axial Tension Check</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#2e7d32' }}>SAFE (DCR: 0.54)</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Axial Compression (Buckling)</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#2e7d32' }}>SAFE (DCR: 0.68)</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Slenderness Ratio (λ)</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>142 &lt; 180 (SAFE)</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Connection Capacity (HSFG M20)</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#2e7d32' }}>SAFE (DCR: 0.61)</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Overall Status</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#2e7d32' }}>PASS</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'diaphragm' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '12px',
                background: 'var(--bg-grouped)'
              }}>
                <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--accent-osdag)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  End Diaphragm Specifications
                </div>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '6px 0', color: 'var(--text-sub)' }}>Diaphragm Configuration</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>Heavy End Frame with Bearing Stiffeners</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '6px 0', color: 'var(--text-sub)' }}>Top & Bottom Struts</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>ISMC 200</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '6px 0', color: 'var(--text-sub)' }}>Diagonal Bracing</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>2 × ISA 100 × 100 × 10 mm</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '6px 0', color: 'var(--text-sub)' }}>Bearing Stiffeners Pair</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>200 × 20 mm plates (each side)</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 0', color: 'var(--text-sub)' }}>Bearing Reaction Capacity</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#2e7d32' }}>1,850 kN &gt; 1,420 kN (SAFE)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
            onClick={() => setTransverseDesignModalOpen(false)}
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
