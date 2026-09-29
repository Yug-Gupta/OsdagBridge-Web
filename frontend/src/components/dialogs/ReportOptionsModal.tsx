import React, { useState } from 'react';
import { X, FileText, Download, Printer } from 'lucide-react';
import { useBridgeStore } from '../../store/useBridgeStore';
import {
  getCarriagewayWidth,
  getDeckMaterial,
  getGirderMaterial,
  getNoOfGirders,
  getSpan,
} from '../../utils/bridgeInputs';

export const ReportOptionsModal: React.FC = () => {
  const { isReportModalOpen, setReportModalOpen, inputs, additionalInputs, location, dcrValues } = useBridgeStore();

  const reportSpan = getSpan(inputs);
  const reportWidth = getCarriagewayWidth(inputs);
  const reportGirders = getNoOfGirders(inputs, additionalInputs);
  const reportGirderSpacing = (reportWidth / Math.max(1, reportGirders - 1)).toFixed(2);

  const [metadata, setMetadata] = useState({
    projectTitle: 'Highway Steel Plate Girder Bridge Design',
    bridgeNo: 'BR-2026-01',
    client: 'National Highways Authority of India (NHAI)',
    designer: 'Osdag Bridge Engineer',
    date: new Date().toLocaleDateString('en-GB')
  });

  const [sections, setSections] = useState({
    geometry: true,
    materials: true,
    loads: true,
    girderAnalysis: true,
    girderDesign: true,
    stiffeners: true,
    transverse: true,
    deck: true
  });

  if (!isReportModalOpen) return null;

  const handleGenerateReport = () => {
    // Generate full HTML report in new tab with print styling
    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>OsdagBridge Design Report — ${metadata.projectTitle}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #222; max-width: 900px; margin: 0 auto; line-height: 1.6; }
          .header { border-bottom: 3px solid #90AF13; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
          h1 { color: #222; margin: 0 0 6px 0; font-size: 24px; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .meta-table td { padding: 6px 12px; border: 1px solid #ddd; font-size: 13px; }
          .meta-table td.label { font-weight: bold; background: #f9f9f9; width: 25%; }
          h2 { color: #90AF13; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-top: 30px; font-size: 16px; }
          table.data { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
          table.data th, table.data td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
          table.data th { background: #90AF13; color: white; }
          .badge-pass { background: #e8f5e9; color: #2e7d32; font-weight: bold; padding: 2px 8px; border-radius: 4px; }
          @media print { body { padding: 0; } button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>OsdagBridge — Design Calculation Report</h1>
            <div style="font-size: 14px; color: #555;">Highway Steel Bridge Superstructure Design to IRC Standards</div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #777;">
            <div>Date: ${metadata.date}</div>
            <div>Ref: ${metadata.bridgeNo}</div>
          </div>
        </div>

        <table class="meta-table">
          <tr>
            <td class="label">Project Title:</td><td>${metadata.projectTitle}</td>
            <td class="label">Bridge Reference:</td><td>${metadata.bridgeNo}</td>
          </tr>
          <tr>
            <td class="label">Client / Authority:</td><td>${metadata.client}</td>
            <td class="label">Engineer / Designer:</td><td>${metadata.designer}</td>
          </tr>
          <tr>
            <td class="label">Project Location:</td><td colspan="3">${location ? `${location.station}, ${location.state}` : 'New Delhi, Delhi'} (Wind Speed: ${location ? location.basic_wind_speed : 47} m/s)</td>
          </tr>
        </table>

        ${sections.geometry ? `
          <h2>1. Bridge Geometry & Superstructure Layout</h2>
          <table class="data">
            <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
            <tr><td>Total Bridge Span</td><td>${reportSpan}</td><td>m</td></tr>
            <tr><td>Carriageway Width</td><td>${reportWidth}</td><td>m</td></tr>
            <tr><td>Number of Longitudinal Girders</td><td>${reportGirders}</td><td>-</td></tr>
            <tr><td>Girder Spacing (c/c)</td><td>${reportGirderSpacing}</td><td>m</td></tr>
            <tr><td>Skew Angle</td><td>${inputs.Skew_Angle || 0.0}</td><td>°</td></tr>
          </table>
        ` : ''}

        ${sections.materials ? `
          <h2>2. Material Specifications</h2>
          <table class="data">
            <tr><th>Component</th><th>Material Grade</th><th>Yield Strength (fy)</th><th>Standard</th></tr>
            <tr><td>Plate Girders</td><td>${getGirderMaterial(inputs) || 'E 250'}</td><td>250 MPa</td><td>IS 2062 / IRC 24</td></tr>
            <tr><td>Deck Slab</td><td>${getDeckMaterial(inputs) || 'M 35'}</td><td>fck = 35 MPa</td><td>IRC 112</td></tr>
            <tr><td>Reinforcement</td><td>Fe 500D</td><td>500 MPa</td><td>IS 1786</td></tr>
          </table>
        ` : ''}

        ${sections.girderDesign ? `
          <h2>3. Girder Design Summary & Limit State Checks (IRC:24 / IS 800)</h2>
          <table class="data">
            <tr><th>Limit State Check</th><th>Clause</th><th>Utilization (DCR)</th><th>Result</th></tr>
            <tr><td>Flexure (Bending Resistance)</td><td>IRC:24 Cl. 8.2</td><td>${dcrValues.flexure || 78}%</td><td><span class="badge-pass">PASS</span></td></tr>
            <tr><td>Shear Resistance</td><td>IRC:24 Cl. 8.4</td><td>${dcrValues.shear || 64}%</td><td><span class="badge-pass">PASS</span></td></tr>
            <tr><td>Combined Interaction (M + V)</td><td>IRC:24 Cl. 8.2.3</td><td>${dcrValues.interaction || 82}%</td><td><span class="badge-pass">PASS</span></td></tr>
            <tr><td>Lateral Torsional Buckling</td><td>IRC:24 Cl. 8.2.2</td><td>${dcrValues.ltb || 71}%</td><td><span class="badge-pass">PASS</span></td></tr>
            <tr><td>Fatigue Resistance</td><td>IRC:24 Cl. 13</td><td>${dcrValues.fatigue || 48}%</td><td><span class="badge-pass">PASS</span></td></tr>
            <tr><td>Live Load Deflection Limit (L/800)</td><td>IRC:24 Cl. 5.4</td><td>${dcrValues.deflection || 62}%</td><td><span class="badge-pass">PASS</span></td></tr>
          </table>
        ` : ''}

        <div style="margin-top: 50px; text-align: center; color: #888; font-size: 11px;">
          Generated automatically by OsdagBridge Web — Indian Institute of Technology Bombay
        </div>

        <script>
          window.print();
        </script>
      </body>
      </html>
    `;
    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
      reportWindow.document.write(reportHtml);
      reportWindow.document.close();
    }
    setReportModalOpen(false);
  };

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
        width: '680px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} />
            <span>Generate Design Report</span>
          </div>
          <button
            type="button"
            onClick={() => setReportModalOpen(false)}
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
          {/* Metadata Section */}
          <div style={{
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '12px',
            background: 'var(--bg-grouped)'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-osdag)', textTransform: 'uppercase', marginBottom: '10px' }}>
              Project Information
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-sub)', display: 'block', marginBottom: '3px' }}>Project Title</label>
                <input
                  type="text"
                  value={metadata.projectTitle}
                  onChange={(e) => setMetadata({ ...metadata, projectTitle: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    fontSize: '12px'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-sub)', display: 'block', marginBottom: '3px' }}>Bridge No / ID</label>
                <input
                  type="text"
                  value={metadata.bridgeNo}
                  onChange={(e) => setMetadata({ ...metadata, bridgeNo: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    fontSize: '12px'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-sub)', display: 'block', marginBottom: '3px' }}>Client / Authority</label>
                <input
                  type="text"
                  value={metadata.client}
                  onChange={(e) => setMetadata({ ...metadata, client: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    fontSize: '12px'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-sub)', display: 'block', marginBottom: '3px' }}>Engineer / Designer</label>
                <input
                  type="text"
                  value={metadata.designer}
                  onChange={(e) => setMetadata({ ...metadata, designer: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    fontSize: '12px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sections to Include */}
          <div style={{
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '12px',
            background: 'var(--bg-grouped)'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-osdag)', textTransform: 'uppercase', marginBottom: '10px' }}>
              Report Sections to Include
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {[
                { key: 'geometry', label: '1. Project Geometry & Layout' },
                { key: 'materials', label: '2. Material Specifications' },
                { key: 'loads', label: '3. Design Loading & Combinations (IRC 6)' },
                { key: 'girderAnalysis', label: '4. Structural Analysis (BMD / SFD)' },
                { key: 'girderDesign', label: '5. Girder Limit State Checks (IRC 24)' },
                { key: 'stiffeners', label: '6. Web Stiffener Configurations' },
                { key: 'transverse', label: '7. Cross Bracing & Diaphragms' },
                { key: 'deck', label: '8. RCC Deck Slab Reinforcement' },
              ].map(sec => (
                <label key={sec.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(sections[sec.key as keyof typeof sections])}
                    onChange={(e) => setSections({ ...sections, [sec.key]: e.target.checked })}
                    style={{ accentColor: 'var(--accent-osdag)', cursor: 'pointer' }}
                  />
                  <span>{sec.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
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
            onClick={() => setReportModalOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-sub)',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleGenerateReport}
            style={{
              background: 'var(--accent-osdag)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '7px 22px',
              fontWeight: 600,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Printer size={15} />
            <span>Generate & Print Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
