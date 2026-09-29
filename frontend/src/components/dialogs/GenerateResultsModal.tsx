import React, { useState } from 'react';
import { X, Table, Download, FileSpreadsheet } from 'lucide-react';
import { useBridgeStore } from '../../store/useBridgeStore';
import {
  getCarriagewayWidth,
  getDeckMaterial,
  getGirderMaterial,
  getNoOfGirders,
  getSpan,
  INPUT_KEYS,
} from '../../utils/bridgeInputs';

interface ResultRow {
  parameter: string;
  value: string | number;
  unit?: string;
  status?: string;
}

export const GenerateResultsModal: React.FC = () => {
  const { isGenerateResultsModalOpen, setGenerateResultsModalOpen, inputs, additionalInputs, location } = useBridgeStore();
  const [selectedSection, setSelectedSection] = useState<string>('bridge_config');

  if (!isGenerateResultsModalOpen) return null;

  const span = getSpan(inputs);
  const noOfGirders = getNoOfGirders(inputs, additionalInputs);
  const carriageway = getCarriagewayWidth(inputs);

  const sectionsData: Record<string, { title: string; rows: ResultRow[] }> = {
    bridge_config: {
      title: 'Bridge Configuration Summary',
      rows: [
        { parameter: 'Structure Type', value: 'Plate Girder Bridge', unit: '-' },
        { parameter: 'Span Length', value: span, unit: 'm' },
        { parameter: 'Carriageway Width', value: carriageway, unit: 'm' },
        { parameter: 'Number of Girders', value: noOfGirders, unit: '-' },
        { parameter: 'Girder Spacing (c/c)', value: (carriageway / (noOfGirders - 1)).toFixed(2), unit: 'm' },
        { parameter: 'Skew Angle', value: inputs[INPUT_KEYS.skewAngle] || 0.0, unit: '°' },
        { parameter: 'Project Location', value: location ? `${location.station}, ${location.state}` : 'New Delhi, Delhi', unit: '-' },
        { parameter: 'Basic Wind Speed (Vb)', value: location ? location.basic_wind_speed : 47, unit: 'm/s' },
        { parameter: 'Seismic Zone', value: location ? `Zone ${location.seismic_zone}` : 'Zone IV', unit: '-' },
      ]
    },
    materials: {
      title: 'Material Properties',
      rows: [
        { parameter: 'Girder Structural Steel', value: getGirderMaterial(inputs) || 'E 250 (Fe 410 W) A', unit: '-' },
        { parameter: 'Steel Yield Strength (fy)', value: 250, unit: 'MPa' },
        { parameter: 'Steel Ultimate Strength (fu)', value: 410, unit: 'MPa' },
        { parameter: 'Modulus of Elasticity (Es)', value: '2.0 × 10⁵', unit: 'MPa' },
        { parameter: 'Deck Concrete Grade', value: getDeckMaterial(inputs) || 'M 35', unit: '-' },
        { parameter: 'Concrete Compressive Strength (fck)', value: 35, unit: 'MPa' },
        { parameter: 'Deck Reinforcement Steel', value: 'Fe 500D', unit: '-' },
        { parameter: 'Reinforcement Yield Strength (fy)', value: 500, unit: 'MPa' },
      ]
    },
    girder_design: {
      title: 'Girder Design Results (Critical Member G1)',
      rows: [
        { parameter: 'Total Girder Depth', value: Math.round(span * 65), unit: 'mm' },
        { parameter: 'Web Plate Thickness', value: 16, unit: 'mm' },
        { parameter: 'Top Flange Width', value: 450, unit: 'mm' },
        { parameter: 'Top Flange Thickness', value: 28, unit: 'mm' },
        { parameter: 'Bottom Flange Width', value: 500, unit: 'mm' },
        { parameter: 'Bottom Flange Thickness', value: 32, unit: 'mm' },
        { parameter: 'Flexural Limit State DCR', value: '0.78', unit: 'ratio', status: 'PASS' },
        { parameter: 'Shear Limit State DCR', value: '0.64', unit: 'ratio', status: 'PASS' },
        { parameter: 'Interaction (M + V) DCR', value: '0.82', unit: 'ratio', status: 'PASS' },
        { parameter: 'Lateral Torsional Buckling DCR', value: '0.71', unit: 'ratio', status: 'PASS' },
        { parameter: 'Resistance to Fatigue DCR', value: '0.48', unit: 'ratio', status: 'PASS' },
        { parameter: 'Max Deflection under LL', value: '26.4', unit: 'mm', status: 'PASS' },
      ]
    },
    stiffeners: {
      title: 'Stiffeners Configuration',
      rows: [
        { parameter: 'Bearing Stiffeners Pair at Supports', value: '2 Pairs (200 × 20 mm)', unit: '-' },
        { parameter: 'Bearing Stiffeners Spacing', value: '180', unit: 'mm' },
        { parameter: 'Intermediate Transverse Stiffeners', value: 'Yes (140 × 12 mm)', unit: '-' },
        { parameter: 'Intermediate Stiffeners Spacing', value: '1,500', unit: 'mm c/c' },
        { parameter: 'Longitudinal Web Stiffener', value: 'Not Required (d/tw < 150)', unit: '-' },
        { parameter: 'Stiffener Weld Size', value: '6 mm Fillet', unit: '-' },
      ]
    },
    bracing: {
      title: 'Cross Bracing & Diaphragm',
      rows: [
        { parameter: 'Cross Bracing Type', value: 'X-Type with Top & Bottom Chords', unit: '-' },
        { parameter: 'Diagonal Angles Section', value: 'ISA 90 × 90 × 8 mm', unit: '-' },
        { parameter: 'Top Chord Angle Section', value: 'ISA 75 × 75 × 6 mm', unit: '-' },
        { parameter: 'Bottom Chord Angle Section', value: 'ISA 75 × 75 × 6 mm', unit: '-' },
        { parameter: 'Cross Frame Spacing', value: '4.5', unit: 'm' },
        { parameter: 'End Diaphragm Configuration', value: 'Heavy End Frame with Bearing Plates', unit: '-' },
        { parameter: 'Fastener Type', value: 'M20 Grade 8.8 HSFG Bolts', unit: '-' },
      ]
    }
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Section,Parameter,Value,Unit,Status\n";
    Object.entries(sectionsData).forEach(([secKey, sec]) => {
      sec.rows.forEach(r => {
        csvContent += `"${sec.title}","${r.parameter}","${r.value}","${r.unit || ''}","${r.status || ''}"\n`;
      });
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OsdagBridge_Results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const activeSectionData = sectionsData[selectedSection] || sectionsData.bridge_config;

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
        width: '840px',
        maxWidth: '94vw',
        height: '620px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Table size={16} />
            <span>Generate Results Table</span>
          </div>
          <button
            type="button"
            onClick={() => setGenerateResultsModalOpen(false)}
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

        {/* Modal Body: Left Tree Sidebar + Right Table */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Navigation Tree */}
          <div style={{
            width: '240px',
            background: 'var(--bg-grouped)',
            borderRight: '1px solid var(--border-color)',
            padding: '12px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            overflowY: 'auto'
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-sub)', textTransform: 'uppercase', padding: '6px 8px' }}>
              Results Sections
            </div>
            {[
              { id: 'bridge_config', label: 'Bridge Configuration' },
              { id: 'materials', label: 'Material Properties' },
              { id: 'girder_design', label: 'Girder Design Results' },
              { id: 'stiffeners', label: 'Stiffener Details' },
              { id: 'bracing', label: 'Cross Bracing & Diaphragm' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedSection(item.id)}
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  background: selectedSection === item.id ? 'var(--accent-osdag)' : 'transparent',
                  color: selectedSection === item.id ? '#ffffff' : 'var(--text-main)',
                  fontWeight: selectedSection === item.id ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Table Container */}
          <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--text-main)',
              marginBottom: '12px'
            }}>
              {activeSectionData.title}
            </div>

            <div style={{
              flex: 1,
              border: '1px solid var(--accent-osdag)',
              borderRadius: '6px',
              overflowY: 'auto'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--accent-osdag)', color: '#ffffff', textAlign: 'left', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Parameter</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Value</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, width: '60px' }}>Unit</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, width: '70px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSectionData.rows.map((row, idx) => (
                    <tr
                      key={idx}
                      style={{
                        background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-grouped)',
                        borderBottom: '1px solid var(--border-subtle)'
                      }}
                    >
                      <td style={{ padding: '7px 12px', color: 'var(--text-main)' }}>{row.parameter}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {row.value}
                      </td>
                      <td style={{ padding: '7px 12px', textAlign: 'center', color: 'var(--text-sub)' }}>{row.unit}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'center' }}>
                        {row.status ? (
                          <span style={{
                            background: '#e8f5e9',
                            color: '#2e7d32',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontWeight: 700,
                            fontSize: '10px'
                          }}>
                            {row.status}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '10px 16px',
          background: 'var(--bg-grouped)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '6px 14px',
              fontWeight: 600,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Download size={14} />
            <span>Export to CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setGenerateResultsModalOpen(false)}
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
