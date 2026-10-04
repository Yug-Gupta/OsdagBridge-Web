/**
 * CadTopViewDock.tsx
 * Web implementation of OsdagBridge Top View CAD Widget.
 * Mirrors osdagbridge.desktop.ui.docks.cad_top_view.TopViewCADWidget
 *
 * Renders full 2D plan/top view of the bridge superstructure:
 *   - Longitudinal plate girders with skew angle offset (x_offset = y_offset * tan(θ))
 *   - End diaphragms (double solid lines connecting adjacent girders at both supports)
 *   - Bearing center lines (dashed lines with CL of Bearing labels)
 *   - Intermediate transverse cross bracings at calculated spacing along the span
 *   - Skew angle indicator arc with angle value (θ)
 *   - CAD dimension lines with arrows, extension guides, and text labels:
 *       * CL of Bearing
 *       * Girder Spacing
 *       * Bracing Spacing
 *       * Span Length
 *   - Component hover highlight with interactive leader labels
 *   - Zoom In / Zoom Out / Fit-to-screen controls with smooth mouse drag/pan
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react';
import {
  getCarriagewayWidth,
  getDeckOverhang,
  getGirderSpacing,
  getNoOfGirders,
  getSpan,
  hasUserCarriagewayWidth,
  hasUserSpan,
  INPUT_KEYS,
  CAD_DEFAULTS,
} from '../../utils/bridgeInputs';

export interface CadTopViewDockProps {
  visible?: boolean;
  onClose?: () => void;
  isStandalone?: boolean;
  scaleFactor?: number;
}

// Shared CAD Palette matching desktop TopViewCADWidget
const GIRDER_COLOR = '#B3B4A0';
const CROSS_BRACING_COLOR = '#EBECD3';
const END_DIAPHRAGM_COLOR = '#868664';
const CAD_DARK_GREY = '#5A5A5A';
const CAD_HOVER_GREY = '#6E6E6E';

export const CadTopViewDock: React.FC<CadTopViewDockProps> = ({
  visible = true,
  onClose,
  isStandalone = true,
  scaleFactor = 1.0,
}) => {
  const { inputs, additionalInputs } = useBridgeStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport transformation states
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hover states
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  // ── Extract parameters from store ──
  // Always use CAD fallback defaults when inputs are blank (mirrors desktop cad_top_view.py)
  const spanLength = getSpan(inputs) * 1000; // mm (35,000)
  const numGirders = Math.max(1, getNoOfGirders(inputs, additionalInputs)); // 4
  const carriagewayWidth = getCarriagewayWidth(inputs) * 1000; // mm (10,500)
  const skewAngleDeg = Number(inputs[INPUT_KEYS.skewAngle] || 0.0);
  const deckOverhang = getDeckOverhang(inputs, additionalInputs) * 1000; // mm (1,000)
  const crossBracingSpacing = CAD_DEFAULTS.CROSS_BRACING_SPACING_MM; // mm (3,500)
  const girderSpacing = getGirderSpacing(inputs, additionalInputs) * 1000; // mm (2,750)

  // Flags: did user explicitly enter span or carriageway values?
  const userHasSpan = hasUserSpan(inputs);
  const userHasCarriageway = hasUserCarriagewayWidth(inputs);

  const handleFitToScreen = useCallback(() => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoomLevel((prev) => Math.max(0.3, Math.min(4.0, prev * factor)));
  };

  // Main Canvas Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 800;
    const height = canvas.clientHeight || 500;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear background to solid white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Total width across outer girder edges plus overhangs
    const totalGirderWidth =
      numGirders > 1
        ? (numGirders - 1) * girderSpacing + 2 * deckOverhang
        : 2 * deckOverhang;

    // Viewport-fit scaling matching desktop TopViewCADWidget (15% padding)
    const PADDING = 0.15;
    const availW = width * (1.0 - 2 * PADDING);
    const availH = height * (1.0 - 2 * PADDING);
    const scale = Math.min(
      availW / Math.max(spanLength, 1.0),
      availH / Math.max(totalGirderWidth, 1.0)
    );

    const centerX = width / 2;
    const centerY = height / 2;

    const skewRad = (skewAngleDeg * Math.PI) / 180;
    const spanLengthPx = spanLength * scale;
    const spacingPx = girderSpacing * scale;

    const startXBase = centerX - spanLengthPx / 2;
    const endXBase = centerX + spanLengthPx / 2;

    // Y coordinates of girders centered vertically
    const totalHeightPx = (numGirders - 1) * spacingPx;
    const startY = centerY - totalHeightPx / 2;
    const girderPositionsY = Array.from(
      { length: numGirders },
      (_, i) => startY + i * spacingPx
    );

    const girderLines: { y: number; x1: number; x2: number }[] = [];

    // Apply smooth pan & zoom transformations centered at (centerX, centerY)
    ctx.save();
    ctx.translate(centerX + panOffset.x, centerY + panOffset.y);
    ctx.scale(zoomLevel * scaleFactor, zoomLevel * scaleFactor);
    ctx.translate(-centerX, -centerY);

    // Helper to draw text with white background badge
    const drawTextWithBg = (
      text: string,
      x: number,
      y: number,
      options?: { align?: CanvasTextAlign; fontSize?: number; bold?: boolean }
    ) => {
      const fontSize = options?.fontSize ?? 9;
      const isBold = options?.bold ?? false;
      const align = options?.align ?? 'center';
      ctx.font = `${isBold ? 'bold ' : ''}${fontSize}px Arial, sans-serif`;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';

      const lines = text.split('\n');
      const lineHeight = fontSize + 3;
      const totalH = lines.length * lineHeight;
      const maxW = Math.max(...lines.map((l) => ctx.measureText(l).width));
      const padding = 2;

      let bgX = x - maxW / 2 - padding;
      if (align === 'left') bgX = x - padding;
      else if (align === 'right') bgX = x - maxW - padding;
      const bgY = y - totalH / 2 - padding;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(bgX, bgY, maxW + 2 * padding, totalH + 2 * padding);

      ctx.fillStyle = '#000000';
      const textStartY = y - totalH / 2 + lineHeight / 2;
      lines.forEach((line, i) => {
        ctx.fillText(line, x, textStartY + i * lineHeight);
      });
    };

    // Helper to draw horizontal dimension line with extension lines going UP to girder
    const drawDimensionArrowWithExtensionsUp = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      text: string,
      girderY: number
    ) => {
      ctx.save();

      // Main line
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Dotted extension lines going UP to girder level
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = '#646464';
      ctx.lineWidth = 0.8;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1, girderY);
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2, girderY);
      ctx.stroke();
      ctx.setLineDash([]);

      // End ticks
      const extLen = 6;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x1, y1 - extLen);
      ctx.lineTo(x1, y1 + extLen);
      ctx.moveTo(x2, y2 - extLen);
      ctx.lineTo(x2, y2 + extLen);
      ctx.stroke();

      // Arrowheads (arrow_len = 6, arrow_half = 2)
      const arrowLen = 6;
      const arrowHalf = 2;
      ctx.fillStyle = '#000000';

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + arrowLen, y1 - arrowHalf);
      ctx.lineTo(x1 + arrowLen, y1 + arrowHalf);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - arrowLen, y2 - arrowHalf);
      ctx.lineTo(x2 - arrowLen, y2 + arrowHalf);
      ctx.closePath();
      ctx.fill();

      // Draw text ABOVE dimension line
      if (text) {
        const midX = (x1 + x2) / 2;
        drawTextWithBg(text, midX, y1 - 8, { align: 'center' });
      }
      ctx.restore();
    };

    // ── 1. Draw Girders (Plate girder horizontal lines) ──
    girderPositionsY.forEach((yPos) => {
      const yOffset = yPos - girderPositionsY[0];
      const xOffset = yOffset * Math.tan(skewRad);

      const x1 = startXBase + xOffset;
      const x2 = endXBase + xOffset;

      ctx.beginPath();
      ctx.moveTo(x1, yPos);
      ctx.lineTo(x2, yPos);
      ctx.strokeStyle = hoveredElement === 'girder' ? CAD_HOVER_GREY : GIRDER_COLOR;
      ctx.lineWidth = hoveredElement === 'girder' ? 4.5 : 2.5;
      ctx.stroke();

      girderLines.push({ y: yPos, x1, x2 });
    });

    // ── 2. Bearing Center Lines & Abutment Extents ──
    const bearingGapPx = Math.max(30, 0.3 * spacingPx);
    const topExtent = girderPositionsY[0] - bearingGapPx;
    const botExtent =
      numGirders > 1
        ? girderPositionsY[numGirders - 1] + bearingGapPx
        : girderPositionsY[0] + bearingGapPx;

    const leftTopX = startXBase + (topExtent - girderPositionsY[0]) * Math.tan(skewRad);
    const leftBotX = startXBase + (botExtent - girderPositionsY[0]) * Math.tan(skewRad);
    const rightTopX = endXBase + (topExtent - girderPositionsY[0]) * Math.tan(skewRad);
    const rightBotX = endXBase + (botExtent - girderPositionsY[0]) * Math.tan(skewRad);

    // Left and Right Bearing Dashed Centerlines [8, 8]
    ctx.beginPath();
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = hoveredElement === 'bearing' ? CAD_HOVER_GREY : CAD_DARK_GREY;
    ctx.lineWidth = hoveredElement === 'bearing' ? 2.5 : 1.5;
    ctx.moveTo(leftTopX, topExtent);
    ctx.lineTo(leftBotX, botExtent);
    ctx.moveTo(rightTopX, topExtent);
    ctx.lineTo(rightBotX, botExtent);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── 3. End Diaphragms (Double solid lines connecting adjacent girders) ──
    if (numGirders > 1) {
      const lineOffset = 2.0;
      ctx.strokeStyle = hoveredElement === 'end_diaphragm' ? CAD_HOVER_GREY : END_DIAPHRAGM_COLOR;
      ctx.lineWidth = hoveredElement === 'end_diaphragm' ? 4.0 : 3.0;

      for (let i = 0; i < numGirders - 1; i++) {
        const y1 = girderPositionsY[i];
        const y2 = girderPositionsY[i + 1];

        const y1Offset = y1 - girderPositionsY[0];
        const y2Offset = y2 - girderPositionsY[0];

        const x1L = startXBase + y1Offset * Math.tan(skewRad);
        const x2L = startXBase + y2Offset * Math.tan(skewRad);

        const x1R = endXBase + y1Offset * Math.tan(skewRad);
        const x2R = endXBase + y2Offset * Math.tan(skewRad);

        const dxL = x2L - x1L;
        const dyL = y2 - y1;
        const lenL = Math.hypot(dxL, dyL);
        if (lenL > 0) {
          const perpX = (-dyL / lenL) * lineOffset;
          const perpY = (dxL / lenL) * lineOffset;

          ctx.beginPath();
          ctx.moveTo(x1L + perpX, y1 + perpY);
          ctx.lineTo(x2L + perpX, y2 + perpY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(x1L - perpX, y1 - perpY);
          ctx.lineTo(x2L - perpX, y2 - perpY);
          ctx.stroke();
        }

        const dxR = x2R - x1R;
        const dyR = y2 - y1;
        const lenR = Math.hypot(dxR, dyR);
        if (lenR > 0) {
          const perpX = (-dyR / lenR) * lineOffset;
          const perpY = (dxR / lenR) * lineOffset;

          ctx.beginPath();
          ctx.moveTo(x1R + perpX, y1 + perpY);
          ctx.lineTo(x2R + perpX, y2 + perpY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(x1R - perpX, y1 - perpY);
          ctx.lineTo(x2R - perpX, y2 - perpY);
          ctx.stroke();
        }
      }
    }

    // ── 4. Intermediate Transverse Cross Bracing ──
    const bracingPositionsX: number[] = [];
    if (numGirders > 1 && crossBracingSpacing > 0) {
      const numBays = Math.max(1, Math.round(spanLength / crossBracingSpacing));
      const actualSpacingPx = spanLengthPx / numBays;

      ctx.strokeStyle = hoveredElement === 'cross_bracing' ? CAD_HOVER_GREY : CROSS_BRACING_COLOR;
      ctx.lineWidth = hoveredElement === 'cross_bracing' ? 3.5 : 1.8;

      for (let bay = 1; bay < numBays; bay++) {
        const braceXBase = startXBase + bay * actualSpacingPx;

        for (let i = 0; i < numGirders - 1; i++) {
          const y1 = girderPositionsY[i];
          const y2 = girderPositionsY[i + 1];

          const x1 = braceXBase + (y1 - girderPositionsY[0]) * Math.tan(skewRad);
          const x2 = braceXBase + (y2 - girderPositionsY[0]) * Math.tan(skewRad);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          if (i === 0) {
            bracingPositionsX.push(braceXBase);
          }
        }
      }
    }

    // ── 5. Skew Angle Indicator (if non-zero) ──
    if (Math.abs(skewAngleDeg) > 0.1) {
      const refX = startXBase;
      const refY = girderPositionsY[0];
      const arcRadius = 70;

      // Vertical dashed reference
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.moveTo(refX, refY);
      ctx.lineTo(refX, refY - arcRadius - 20);
      ctx.stroke();
      ctx.setLineDash([]);

      // Actual skewed bearing line
      const skewedEndX = refX - arcRadius * Math.sin(skewRad);
      const skewedEndY = refY - arcRadius * Math.cos(skewRad);
      ctx.beginPath();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.0;
      ctx.moveTo(refX, refY);
      ctx.lineTo(skewedEndX, skewedEndY);
      ctx.stroke();

      // Skew label
      const angleText = userHasCarriageway
        ? `Skew = ${skewAngleDeg >= 0 ? '+' : ''}${skewAngleDeg.toFixed(1)}°`
        : 'Skew';
      drawTextWithBg(angleText, refX - 35, refY - arcRadius - 10, { bold: true });
    }

    // ── 6. Top View Dimensions (matching desktop TopViewCADWidget) ──
    const lastGirderIdx = girderLines.length - 1;
    const lastGirder = girderLines[lastGirderIdx];
    const lastGirderY = lastGirder.y;
    const yOffsetLast = lastGirderY - girderPositionsY[0];
    const xOffsetLast = yOffsetLast * Math.tan(skewRad);

    const dimYBase = lastGirderY + 28;

    // A. Bracing Spacing (Closer to bridge)
    let dimYNext = dimYBase;
    if (crossBracingSpacing > 0 && bracingPositionsX.length > 1) {
      const x1Brace = bracingPositionsX[0] + xOffsetLast;
      const x2Brace = bracingPositionsX[1] + xOffsetLast;
      const cbSpacingM = crossBracingSpacing / 1000;
      const labelCb = userHasSpan ? `Bracing Spacing = ${cbSpacingM.toFixed(2)} m` : 'Bracing Spacing';

      drawDimensionArrowWithExtensionsUp(
        x1Brace,
        dimYBase,
        x2Brace,
        dimYBase,
        labelCb,
        lastGirderY
      );
      dimYNext = dimYBase + 28;
    }

    // B. Span Length (Below bracing spacing)
    const dimY2 = dimYNext;
    const spanM = spanLength / 1000;
    const labelSpan = userHasSpan ? `Span Length = ${spanM.toFixed(1)} m` : 'Span Length';
    drawDimensionArrowWithExtensionsUp(
      lastGirder.x1,
      dimY2,
      lastGirder.x2,
      dimY2,
      labelSpan,
      lastGirderY
    );

    // C. Girder Spacing (Right side vertical/skewed dimension)
    if (numGirders > 1) {
      const y1 = girderPositionsY[0];
      const y2 = girderPositionsY[1];
      const y1Offset = y1 - girderPositionsY[0];
      const y2Offset = y2 - girderPositionsY[0];
      const x1AtEnd = endXBase + y1Offset * Math.tan(skewRad) + 30;
      const x2AtEnd = endXBase + y2Offset * Math.tan(skewRad) + 30;

      // Draw skewed/vertical dimension line + arrows
      ctx.save();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x1AtEnd, y1);
      ctx.lineTo(x2AtEnd, y2);
      ctx.stroke();

      // Ticks
      const tickLen = 5;
      ctx.beginPath();
      ctx.moveTo(x1AtEnd - tickLen, y1);
      ctx.lineTo(x1AtEnd + tickLen, y1);
      ctx.moveTo(x2AtEnd - tickLen, y2);
      ctx.lineTo(x2AtEnd + tickLen, y2);
      ctx.stroke();

      // Arrows
      const arrowLen = 6;
      const arrowHalf = 2;
      ctx.fillStyle = '#000000';

      ctx.beginPath();
      ctx.moveTo(x1AtEnd, y1);
      ctx.lineTo(x1AtEnd - arrowHalf, y1 + arrowLen);
      ctx.lineTo(x1AtEnd + arrowHalf, y1 + arrowLen);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x2AtEnd, y2);
      ctx.lineTo(x2AtEnd - arrowHalf, y2 - arrowLen);
      ctx.lineTo(x2AtEnd + arrowHalf, y2 - arrowLen);
      ctx.closePath();
      ctx.fill();

      // Girder Spacing horizontal text badge placed to the right
      const labelX = Math.max(x1AtEnd, x2AtEnd) + 12;
      const labelY = (y1 + y2) / 2 + 14;
      const gsM = girderSpacing / 1000;
      let labelText = 'Girder\nSpacing';
      if (userHasCarriageway) {
        labelText += `\n= ${gsM.toFixed(2)} m`;
      }
      drawTextWithBg(labelText, labelX, labelY, { align: 'left' });
      ctx.restore();
    }

    // D. CL of Bearing labels — ALWAYS VISIBLE at top of bearing lines (mirrors desktop)
    const labelYBearing = topExtent - 8;
    const leftLabelX = leftTopX - 45;
    const rightLabelX = rightTopX - 45;

    drawTextWithBg('CL of Bearing', leftLabelX, labelYBearing, { align: 'center' });
    drawTextWithBg('CL of Bearing', rightLabelX, labelYBearing, { align: 'center' });

    ctx.restore();
  }, [
    zoomLevel,
    panOffset,
    scaleFactor,
    inputs,
    additionalInputs,
    hoveredElement,
    spanLength,
    numGirders,
    carriagewayWidth,
    skewAngleDeg,
    girderSpacing,
    crossBracingSpacing,
    deckOverhang,
    userHasSpan,
    userHasCarriageway,
  ]);

  if (!visible) return null;

  return (
    <div
      id="cad_top_view_dock"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: 'var(--bg-surface)',
        border: isStandalone ? '1px solid var(--border-color)' : 'none',
        borderRadius: isStandalone ? '4px' : '0',
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {isStandalone && (
        <div
          style={{
            padding: '6px 10px',
            background: 'var(--bg-grouped)',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>CAD Plan / Top View (2D)</span>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-sub)',
                padding: '2px',
                display: 'flex',
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      )}

      {/* Floating Zoom & Pan Controls (mirrors desktop TopViewCADWidget) */}
      <div
        style={{
          position: 'absolute',
          top: isStandalone ? '42px' : '10px',
          right: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={() => setZoomLevel((prev) => Math.min(prev * 1.15, 4.0))}
          title="Zoom In"
          style={{
            width: '25px',
            height: '25px',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            color: '#333333',
            border: '1px solid #999',
            borderRadius: '3px',
            fontSize: '14px',
            fontWeight: 'bold',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          +
        </button>
        <button
          type="button"
          onClick={() => setZoomLevel((prev) => Math.max(prev / 1.15, 0.3))}
          title="Zoom Out"
          style={{
            width: '25px',
            height: '25px',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            color: '#333333',
            border: '1px solid #999',
            borderRadius: '3px',
            fontSize: '14px',
            fontWeight: 'bold',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          -
        </button>
        <button
          type="button"
          onClick={handleFitToScreen}
          title="Fit to screen"
          style={{
            width: '25px',
            height: '25px',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid #999',
            borderRadius: '3px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '2px',
          }}
        >
          <img src="/vectors/fit_to_screen.svg" alt="Fit to screen" style={{ width: '18px', height: '18px' }} />
        </button>
      </div>

      {/* Main Canvas Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        />
      </div>
    </div>
  );
};
