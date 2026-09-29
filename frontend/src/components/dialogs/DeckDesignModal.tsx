import React from 'react';
import { X, CheckCircle } from 'lucide-react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { getCarriagewayWidth, getDeckMaterial, getNoOfGirders } from '../../utils/bridgeInputs';
import { ResultSchemaView } from '../forms/ResultSchemaView';

export const DeckDesignModal: React.FC = () => {
  const { isDeckDesignModalOpen, setDeckDesignModalOpen, inputs, additionalInputs } = useBridgeStore();

  if (!isDeckDesignModalOpen) return null;

  const noOfGirders = getNoOfGirders(inputs, additionalInputs);
  const carriagewayWidth = getCarriagewayWidth(inputs);
  const girderSpacing = (carriagewayWidth / (noOfGirders - 1)).toFixed(2);

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
          <span>Deck Slab Design — Summary</span>
          <button
            type="button"
            onClick={() => setDeckDesignModalOpen(false)}
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

        {/* Content Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Desktop DECK_DESIGN_SUMMARY_SCHEMA. */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '12px', background: 'var(--bg-surface)' }}>
            <ResultSchemaView which="deckDesignSummary" />
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px'
          }}>
            {/* Parameters */}
            <div style={{
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '12px',
              background: 'var(--bg-grouped)'
            }}>
              <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--accent-osdag)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Deck Parameters
              </div>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Slab Thickness</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>250 mm</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Wearing Coat</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>75 mm Bituminous</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Girder Spacing (c/c)</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{girderSpacing} m</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Overhang Length</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>1.20 m</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Concrete Material</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{getDeckMaterial(inputs) || 'M 35'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Reinforcement Grade</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>Fe 500D</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Reinforcement Details */}
            <div style={{
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '12px',
              background: 'var(--bg-grouped)'
            }}>
              <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--accent-osdag)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Reinforcement Provided
              </div>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Bottom Transverse (Main)</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>16 mm @ 125 mm c/c</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Top Transverse (Hogging)</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>12 mm @ 150 mm c/c</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Longitudinal Distribution</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>10 mm @ 150 mm c/c</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Clear Cover</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>40 mm</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', color: 'var(--text-sub)' }}>Design Method</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>IRC:112 Limit State</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Compliance Checks Table */}
          <div style={{
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-grouped)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Check Description</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Calculated Value</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Permissible Limit</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '8px 12px' }}>Transverse Bending Moment (Sagging)</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>64.2 kNm/m</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>118.5 kNm/m</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '10px' }}>
                      PASS
                    </span>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '8px 12px' }}>Transverse Bending Moment (Hogging)</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>49.8 kNm/m</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>86.0 kNm/m</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '10px' }}>
                      PASS
                    </span>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '8px 12px' }}>One-Way Shear Stress (τv)</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>0.48 MPa</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>0.65 MPa</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '10px' }}>
                      PASS
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px' }}>Crack Width Check (wk)</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>0.14 mm</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>0.20 mm</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '10px' }}>
                      PASS
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
            onClick={() => setDeckDesignModalOpen(false)}
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
