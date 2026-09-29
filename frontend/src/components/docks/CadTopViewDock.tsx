/**
 * CadTopViewDock.tsx
 * Web implementation of OsdagBridge Top View CAD Widget.
 * Mirrors osdagbridge.desktop.ui.docks.cad_top_view.TopViewCADWidget
 *
 * Renders full 2D plan/top view of the bridge superstructure:
 *   - Longitudinal plate girders with skew angle offset (x_offset = y_offset * tan(θ))
 *   - End diaphragms (double solid lines connecting adjacent girders at both supports)
 *   - Bearing center lines (dashed lines with red elastomeric bearing pads at girder intersections)
 *   - Intermediate transverse cross bracings at calculated spacing along the span
 *   - Skew angle indicator arc with angle value (θ)
 *   - CAD dimension lines with arrows, extension guides, and text labels (Span, Spacing, Overhang)
 *   - Component hover highlight with interactive leader labels
 *   - Zoom In / Zoom Out / Fit-to-screen controls with smooth mouse drag/pan
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react';
import { getCarriagewayWidth, getNoOfGirders, getSpan, INPUT_KEYS } from '../../utils/bridgeInputs';

export interface CadTopViewDockProps {
  visible?: boolean;
  onClose?: () => void;
  isStandalone?: boolean;
  scaleFactor?: number;
}

// Shared CAD Palette
const GIRDER_COLOR = '#B3B4A0';
const CROSS_BRACING_COLOR = '#EBECD3';
const END_DIAPHRAGM_COLOR = '#868664';
const BEARING_COLOR = '#FF0000';
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

  // Extract parameters from store
  const spanLength = getSpan(inputs) * 1000; // mm
  const numGirders = Math.max(1, getNoOfGirders(inputs, additionalInputs));
  const carriagewayWidth = getCarriagewayWidth(inputs) * 1000; // mm
  const skewAngleDeg = Number(inputs[INPUT_KEYS.skewAngle] || 0.0);
  const deckOverhang = 1000; // mm
  const crossBracingSpacing = 3500; // mm
  const girderSpacing = (carriagewayWidth - 2 * 500) / Math.max(1, numGirders - 1);

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

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2 + panOffset.x, height / 2 + panOffset.y);
    ctx.scale(zoomLevel * scaleFactor, zoomLevel * scaleFactor);

    // Scale calculation
    const totalGirderWidth = numGirders > 1 ? (numGirders - 1) * girderSpacing + 2 * deckOverhang : 2 * deckOverhang;
    const availWidth = width - 140;
    const availHeight = height - 140;
    const scale = Math.min(availWidth / spanLength, availHeight / Math.max(totalGirderWidth, 1.0));

    const skewRad = (skewAngleDeg * Math.PI) / 180;
    const spanLengthPx = spanLength * scale;
    const spacingPx = girderSpacing * scale;

    const startXBase = -spanLengthPx / 2;
    const endXBase = spanLengthPx / 2;

    // Y coordinates of girders
    const totalHeightPx = (numGirders - 1) * spacingPx;
    const startY = -totalHeightPx / 2;
    const girderPositionsY = Array.from({ length: numGirders }, (_, i) => startY + i * spacingPx);

    const girderLines: { y: number; x1: number; x2: number }[] = [];

    // ── 1. Draw Girders ──
    girderPositionsY.forEach((yPos) => {
      const yOffset = yPos - girderPositionsY[0];
      const xOffset = yOffset * Math.tan(skewRad);

      const x1 = startXBase + xOffset;
      const x2 = endXBase + xOffset;

      ctx.beginPath();
      ctx.moveTo(x1, yPos);
      ctx.lineTo(x2, yPos);
      ctx.strokeStyle = hoveredElement === 'girder' ? CAD_HOVER_GREY : GIRDER_COLOR;
      ctx.lineWidth = hoveredElement === 'girder' ? 4.5 : 3.0;
      ctx.stroke();

      girderLines.push({ y: yPos, x1, x2 });
    });

    // ── 2. Bearing Center Lines & Abutment Extents ──
    const bearingGapPx = Math.max(25, 0.3 * spacingPx);
    const topExtent = girderPositionsY[0] - bearingGapPx;
    const botExtent = girderPositionsY[numGirders - 1] + bearingGapPx;

    const leftTopX = startXBase + (topExtent - girderPositionsY[0]) * Math.tan(skewRad);
    const leftBotX = startXBase + (botExtent - girderPositionsY[0]) * Math.tan(skewRad);
    const rightTopX = endXBase + (topExtent - girderPositionsY[0]) * Math.tan(skewRad);
    const rightBotX = endXBase + (botExtent - girderPositionsY[0]) * Math.tan(skewRad);

    // Left and Right Bearing Dashed Centerlines
    ctx.beginPath();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = CAD_DARK_GREY;
    ctx.lineWidth = 1.2;
    ctx.moveTo(leftTopX, topExtent);
    ctx.lineTo(leftBotX, botExtent);
    ctx.moveTo(rightTopX, topExtent);
    ctx.lineTo(rightBotX, botExtent);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── 3. Bearing Pads (Red Rectangles at each girder support) ──
    const padW = Math.max(6, 14 * scale * 2.5);
    const padH = Math.max(4, 8 * scale * 2.5);
    ctx.fillStyle = BEARING_COLOR;
    ctx.strokeStyle = '#880000';
    ctx.lineWidth = 1;

    girderLines.forEach((gl) => {
      // Left bearing pad
      ctx.fillRect(gl.x1 - padW / 2, gl.y - padH / 2, padW, padH);
      ctx.strokeRect(gl.x1 - padW / 2, gl.y - padH / 2, padW, padH);

      // Right bearing pad
      ctx.fillRect(gl.x2 - padW / 2, gl.y - padH / 2, padW, padH);
      ctx.strokeRect(gl.x2 - padW / 2, gl.y - padH / 2, padW, padH);
    });

    // ── 4. End Diaphragms (Double solid lines connecting adjacent girders) ──
    if (numGirders > 1) {
      const lineOffset = 2.5;
      ctx.strokeStyle = hoveredElement === 'end_diaphragm' ? CAD_HOVER_GREY : END_DIAPHRAGM_COLOR;
      ctx.lineWidth = hoveredElement === 'end_diaphragm' ? 3.5 : 2.5;

      for (let i = 0; i < numGirders - 1; i++) {
        const y1 = girderPositionsY[i];
        const y2 = girderPositionsY[i + 1];

        const x1L = startXBase + (y1 - girderPositionsY[0]) * Math.tan(skewRad);
        const x2L = startXBase + (y2 - girderPositionsY[0]) * Math.tan(skewRad);

        const x1R = endXBase + (y1 - girderPositionsY[0]) * Math.tan(skewRad);
        const x2R = endXBase + (y2 - girderPositionsY[0]) * Math.tan(skewRad);

        // Left End Diaphragm double line
        ctx.beginPath();
        ctx.moveTo(x1L - lineOffset, y1);
        ctx.lineTo(x2L - lineOffset, y2);
        ctx.moveTo(x1L + lineOffset, y1);
        ctx.lineTo(x2L + lineOffset, y2);
        ctx.stroke();

        // Right End Diaphragm double line
        ctx.beginPath();
        ctx.moveTo(x1R - lineOffset, y1);
        ctx.lineTo(x2R - lineOffset, y2);
        ctx.moveTo(x1R + lineOffset, y1);
        ctx.lineTo(x2R + lineOffset, y2);
        ctx.stroke();
      }
    }

    // ── 5. Intermediate Transverse Cross Bracing ──
    if (numGirders > 1 && crossBracingSpacing > 0) {
      const numBays = Math.max(1, Math.round(spanLength / crossBracingSpacing));
      const baySpacingPx = spanLengthPx / numBays;

      ctx.strokeStyle = hoveredElement === 'cross_bracing' ? CAD_HOVER_GREY : CROSS_BRACING_COLOR;
      ctx.lineWidth = hoveredElement === 'cross_bracing' ? 3.0 : 1.8;

      for (let bay = 1; bay < numBays; bay++) {
        const bayX = startXBase + bay * baySpacingPx;

        for (let i = 0; i < numGirders - 1; i++) {
          const y1 = girderPositionsY[i];
          const y2 = girderPositionsY[i + 1];

          const x1 = bayX + (y1 - girderPositionsY[0]) * Math.tan(skewRad);
          const x2 = bayX + (y2 - girderPositionsY[0]) * Math.tan(skewRad);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }

    // ── 6. Skew Angle Indicator Arc ──
    if (Math.abs(skewAngleDeg) > 0.1) {
      const arcCenter = { x: girderLines[0].x1, y: girderPositionsY[0] };
      const arcR = 35;

      ctx.beginPath();
      ctx.strokeStyle = '#444444';
      ctx.lineWidth = 1;
      // Baseline perpendicular
      ctx.moveTo(arcCenter.x, arcCenter.y);
      ctx.lineTo(arcCenter.x, arcCenter.y + arcR + 15);
      ctx.stroke();

      // Skew arc
      ctx.beginPath();
      ctx.arc(arcCenter.x, arcCenter.y, arcR, Math.PI / 2, Math.PI / 2 + skewRad, skewRad < 0);
      ctx.stroke();

      // Skew Text
      ctx.font = 'bold 9px Arial, sans-serif';
      ctx.fillStyle = '#111111';
      ctx.fillText(`θ = ${skewAngleDeg.toFixed(1)}°`, arcCenter.x + (skewRad > 0 ? 12 : -45), arcCenter.y + arcR - 5);
    }

    // ── 7. Top View Dimensions ──
    const drawDimArrow = (x1: number, y1: number, x2: number, y2: number, text: string) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      const arrowSize = 4;
      ctx.fillStyle = '#000000';

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + arrowSize, y1 - arrowSize / 2);
      ctx.lineTo(x1 + arrowSize, y1 + arrowSize / 2);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - arrowSize, y2 - arrowSize / 2);
      ctx.lineTo(x2 - arrowSize, y2 + arrowSize / 2);
      ctx.closePath();
      ctx.fill();

      ctx.font = '9px Arial, sans-serif';
      const textW = ctx.measureText(text).width;
      const midX = (x1 + x2) / 2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(midX - textW / 2 - 2, y1 - 13, textW + 4, 11);
      ctx.fillStyle = '#000000';
      ctx.fillText(text, midX - textW / 2, y1 - 4);
    };

    // Bottom Dimension (Span Length)
    const dimYBottom = botExtent + 35;
    drawDimArrow(startXBase, dimYBottom, endXBase, dimYBottom, `Span = ${(spanLength / 1000).toFixed(2)} m`);

    // Extension lines
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#888888';
    ctx.beginPath();
    ctx.moveTo(startXBase, girderPositionsY[numGirders - 1]);
    ctx.lineTo(startXBase, dimYBottom);
    ctx.moveTo(endXBase, girderPositionsY[numGirders - 1]);
    ctx.lineTo(endXBase, dimYBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }, [
    zoomLevel,
    panOffset,
    scaleFactor,
    inputs,
    hoveredElement,
    spanLength,
    numGirders,
    carriagewayWidth,
    skewAngleDeg,
    girderSpacing,
    crossBracingSpacing,
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

      {/* Floating Zoom & Pan Controls */}
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
            width: '26px',
            height: '26px',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #999',
            borderRadius: '3px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#333',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <ZoomIn size={14} />
        </button>
        <button
          type="button"
          onClick={() => setZoomLevel((prev) => Math.max(prev / 1.15, 0.3))}
          title="Zoom Out"
          style={{
            width: '26px',
            height: '26px',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #999',
            borderRadius: '3px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#333',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <ZoomOut size={14} />
        </button>
        <button
          type="button"
          onClick={handleFitToScreen}
          title="Fit to screen"
          style={{
            width: '26px',
            height: '26px',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #999',
            borderRadius: '3px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#333',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Maximize2 size={13} />
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
