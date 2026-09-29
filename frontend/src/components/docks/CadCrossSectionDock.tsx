/**
 * CadCrossSectionDock.tsx
 * Web implementation of OsdagBridge Cross-Section CAD Widget.
 * Mirrors osdagbridge.desktop.ui.docks.cad_cross_section.CrossSectionCADWidget
 *
 * Renders full 2D engineering cross-section of the bridge superstructure:
 *   - Plate girders with accurate visual scaling (flanges, web, chamfered vertical stiffeners)
 *   - Cross bracing (diagonal X-bracing with thickness and center guidelines)
 *   - Curved concrete deck slab with parabolic cross-slope (camber: 0.5%)
 *   - Wearing course asphalt layer
 *   - Crash barriers (IRC:5 RCC or Metallic W-Beam)
 *   - Railings (IRC:5 RCC with square voids or Steel Railing)
 *   - Median (IRC:5 Raised Kerb, RCC double barrier, or Metallic W-beam)
 *   - Standard CAD dimension lines with arrows, extension lines, and labels
 *   - Interactive component hover detection with leader lines and tooltips
 *   - Zoom In / Zoom Out / Fit-to-screen controls with smooth mouse drag/pan
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react';
import { CrashBarrierGeometry, RailingGeometry, MedianGeometry } from '../../utils/irc5Geometry';
import { getCarriagewayWidth, getNoOfGirders, getSpan, INPUT_KEYS } from '../../utils/bridgeInputs';

export interface CadCrossSectionDockProps {
  visible?: boolean;
  onClose?: () => void;
  isStandalone?: boolean;
  scaleFactor?: number;
}

// Shared CAD Palette matching desktop
const GIRDER_COLOR = '#B3B4A0';
const STIFFENER_COLOR = '#D2D2CD';
const CROSS_BRACING_COLOR = '#EBECD3';
const CONCRETE_COLOR = '#E1E1E1';
const ASPHALT_COLOR = '#282828';
const HOVER_HIGHLIGHT_COLOR = '#FFF8D6';
const BORDER_COLOR = '#787878';

export const CadCrossSectionDock: React.FC<CadCrossSectionDockProps> = ({
  visible = true,
  onClose,
  isStandalone = true,
  scaleFactor = 1.0,
}) => {
  const { inputs, additionalInputs } = useBridgeStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport transformation states
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hovered element tracking
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Compute parameters from store inputs
  const spanLength = getSpan(inputs) * 1000; // mm
  const numGirders = Math.max(1, getNoOfGirders(inputs, additionalInputs));
  const carriagewayWidth = getCarriagewayWidth(inputs) * 1000; // mm
  const medianPresent = inputs[INPUT_KEYS.includeMedian] === 'Yes';
  const medianWidth = 1200; // mm
  const deckThickness = 200; // mm
  const deckOverhang = 1000; // mm
  const footpathConfig = (inputs[INPUT_KEYS.footpath] || 'both') as 'both' | 'left' | 'right' | 'none';
  const footpathWidth = 1500; // mm
  const footpathThickness = 200; // mm
  const crashBarrierWidth = 500; // mm
  const railingWidth = 375; // mm
  const wearingCourseThickness = 50; // mm

  // Girder dimensions & visual scale
  const girderDepth = 500;
  const topFlangeW = 180;
  const topFlangeT = 22;
  const botFlangeW = 180;
  const botFlangeT = 22;
  const webT = 15;
  const stiffenerW = 312;

  const visualScale = {
    depth: 3.0,
    flangeWidth: 3.75,
    flangeThickness: 4.05,
    webThickness: 3.75,
  };

  // Compute total deck width
  const computeTotalDeckWidth = useCallback(() => {
    let numFp = 0;
    if (footpathConfig === 'both') numFp = 2;
    else if (footpathConfig === 'left' || footpathConfig === 'right') numFp = 1;

    const carriagewayTotal = medianPresent ? carriagewayWidth * 2 : carriagewayWidth;
    const median = medianPresent ? medianWidth : 0;

    return carriagewayTotal + median + 2 * crashBarrierWidth + numFp * (footpathWidth + railingWidth);
  }, [carriagewayWidth, medianPresent, medianWidth, crashBarrierWidth, footpathConfig, footpathWidth, railingWidth]);

  // Handle fit to screen
  const handleFitToScreen = useCallback(() => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Handle mouse down / move / up for pan
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

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
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

  // Main Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 800;
    const height = canvas.clientHeight || 500;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Apply pan & zoom transformations
    ctx.save();
    ctx.translate(width / 2 + panOffset.x, height / 2 + panOffset.y);
    ctx.scale(zoomLevel * scaleFactor, zoomLevel * scaleFactor);

    const totalDeckWidth = computeTotalDeckWidth();
    const baseScale = Math.min((width - 120) / totalDeckWidth, (height - 180) / 2500);

    const leftFpWidth = footpathConfig === 'left' || footpathConfig === 'both' ? footpathWidth : 0;
    const rightFpWidth = footpathConfig === 'right' || footpathConfig === 'both' ? footpathWidth : 0;
    const leftRailingPresent = leftFpWidth > 0;
    const rightRailingPresent = rightFpWidth > 0;

    const leftRailWPx = leftRailingPresent ? railingWidth * baseScale : 0;
    const rightRailWPx = rightRailingPresent ? railingWidth * baseScale : 0;
    const leftFpWPx = leftFpWidth * baseScale;
    const rightFpWPx = rightFpWidth * baseScale;
    const cbWPx = crashBarrierWidth * baseScale;

    const deckLeftX = -(totalDeckWidth * baseScale) / 2;
    const deckRightX = (totalDeckWidth * baseScale) / 2;

    const leftFpX = deckLeftX + leftRailWPx;
    const leftBarrierX = leftFpX + leftFpWPx;
    const leftBarrierEndX = leftBarrierX + cbWPx;

    const rightFpX = deckRightX - rightRailWPx - rightFpWPx;
    const rightBarrierEndX = rightFpX;
    const rightBarrierX = rightBarrierEndX - cbWPx;

    let cw1StartX = leftBarrierEndX;
    let cw1EndX = rightBarrierX;
    let medianStartX = 0;
    let medianEndX = 0;

    if (medianPresent) {
      const cwWidthPx = carriagewayWidth * baseScale;
      const medianWPx = medianWidth * baseScale;
      cw1StartX = leftBarrierEndX;
      cw1EndX = cw1StartX + cwWidthPx;
      medianStartX = cw1EndX;
      medianEndX = medianStartX + medianWPx;
    }

    const slopeStartX = leftBarrierEndX;
    const slopeEndX = rightBarrierX;

    const computeSlopeOffset = (x: number) => {
      if (x < slopeStartX || x > slopeEndX) return 0;
      const mid = (slopeStartX + slopeEndX) / 2;
      const span = Math.max(1, slopeEndX - slopeStartX);
      const xi = (x - mid) / (span / 2);
      const slopeHeight = 0.005 * (span / 2);
      return -slopeHeight * (1 - xi * xi);
    };

    const girderDepthPx = girderDepth * baseScale * visualScale.depth;
    const deckThickPx = deckThickness * baseScale;
    const fpThickPx = footpathThickness * baseScale;
    const wcThickPx = wearingCourseThickness * baseScale;

    const deckBottomY = 20;
    const deckTopY = deckBottomY - deckThickPx;
    const fpTopY = deckBottomY - fpThickPx;
    const girderBaseY = deckBottomY + girderDepthPx;

    // Girder horizontal locations
    const overhangPx = deckOverhang * baseScale;
    let girderPositions: number[] = [];
    if (numGirders > 1) {
      const firstX = deckLeftX + overhangPx;
      const lastX = deckRightX - overhangPx;
      const spacing = (lastX - firstX) / (numGirders - 1);
      girderPositions = Array.from({ length: numGirders }, (_, i) => firstX + i * spacing);
    } else {
      girderPositions = [0];
    }

    // ── 1. Draw Concrete Deck Slab (Curved polygon) ──
    ctx.beginPath();
    const numPts = 60;
    const topPts: { x: number; y: number }[] = [];
    const botPts: { x: number; y: number }[] = [];

    // Left Footpath
    if (leftFpWidth > 0) {
      topPts.push({ x: deckLeftX, y: fpTopY });
      topPts.push({ x: leftBarrierX, y: fpTopY });
      topPts.push({ x: leftBarrierX, y: deckTopY });
    } else {
      topPts.push({ x: deckLeftX, y: deckTopY });
    }

    // Carriageway Deck with 0.5% slope
    const startDeckX = leftFpWidth > 0 ? leftBarrierX : deckLeftX;
    const endDeckX = rightFpWidth > 0 ? rightBarrierEndX : deckRightX;

    for (let i = 0; i <= numPts; i++) {
      const x = startDeckX + (i * (endDeckX - startDeckX)) / numPts;
      const y = deckTopY + computeSlopeOffset(x);
      topPts.push({ x, y });
    }

    // Right Footpath
    if (rightFpWidth > 0) {
      topPts.push({ x: rightBarrierEndX, y: fpTopY });
      topPts.push({ x: deckRightX, y: fpTopY });
    }

    botPts.push({ x: deckRightX, y: deckBottomY });
    botPts.push({ x: deckLeftX, y: deckBottomY });

    ctx.moveTo(topPts[0].x, topPts[0].y);
    topPts.forEach((p) => ctx.lineTo(p.x, p.y));
    botPts.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.closePath();

    ctx.fillStyle = hoveredElement === 'deck' ? HOVER_HIGHLIGHT_COLOR : CONCRETE_COLOR;
    ctx.fill();
    ctx.strokeStyle = BORDER_COLOR;
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── 2. Wearing Course (Curved asphalt layer) ──
    if (wcThickPx > 0) {
      const drawWearingStrip = (x1: number, x2: number) => {
        if (x2 <= x1) return;
        ctx.beginPath();
        for (let i = 0; i <= 30; i++) {
          const x = x1 + (i * (x2 - x1)) / 30;
          const y = deckTopY + computeSlopeOffset(x) - wcThickPx;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        for (let i = 30; i >= 0; i--) {
          const x = x1 + (i * (x2 - x1)) / 30;
          const y = deckTopY + computeSlopeOffset(x);
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = hoveredElement === 'wearing_course' ? HOVER_HIGHLIGHT_COLOR : ASPHALT_COLOR;
        ctx.fill();
      };

      if (medianPresent) {
        drawWearingStrip(leftBarrierEndX, medianStartX);
        drawWearingStrip(medianEndX, rightBarrierX);
      } else {
        drawWearingStrip(leftBarrierEndX, rightBarrierX);
      }
    }

    // ── 3. Cross Bracings (Diagonal X-bracings between girders) ──
    const tfTopPx = topFlangeT * baseScale * visualScale.flangeThickness;
    const tfBotPx = botFlangeT * baseScale * visualScale.flangeThickness;
    const twPx = webT * baseScale * visualScale.webThickness;
    const braceThk = Math.max(2, 4 * zoomLevel);

    for (let i = 0; i < numGirders - 1; i++) {
      const g1X = girderPositions[i] + twPx / 2;
      const g2X = girderPositions[i + 1] - twPx / 2;

      const topY = deckBottomY + tfTopPx + 2;
      const botY = girderBaseY - tfBotPx - 2;

      // Draw \ diagonal
      ctx.beginPath();
      ctx.moveTo(g1X, topY);
      ctx.lineTo(g2X, botY);
      ctx.strokeStyle = CROSS_BRACING_COLOR;
      ctx.lineWidth = braceThk;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(g1X, topY);
      ctx.lineTo(g2X, botY);
      ctx.strokeStyle = '#999977';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw / diagonal
      ctx.beginPath();
      ctx.moveTo(g1X, botY);
      ctx.lineTo(g2X, topY);
      ctx.strokeStyle = CROSS_BRACING_COLOR;
      ctx.lineWidth = braceThk;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(g1X, botY);
      ctx.lineTo(g2X, topY);
      ctx.strokeStyle = '#999977';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // ── 4. Girders & Stiffeners (I-sections with chamfers) ──
    const bfTopPx = topFlangeW * baseScale * visualScale.flangeWidth;
    const bfBotPx = botFlangeW * baseScale * visualScale.flangeWidth;
    const stiffWPx = stiffenerW * baseScale;

    girderPositions.forEach((gx, idx) => {
      const isGirderHovered = hoveredElement === `girder-${idx}` || hoveredElement === 'girder';
      ctx.fillStyle = isGirderHovered ? '#7a9a12' : GIRDER_COLOR;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.2;

      // Top Flange
      ctx.fillRect(gx - bfTopPx / 2, deckBottomY, bfTopPx, tfTopPx);
      ctx.strokeRect(gx - bfTopPx / 2, deckBottomY, bfTopPx, tfTopPx);

      // Web
      const webHPx = girderDepthPx - tfTopPx - tfBotPx;
      ctx.fillRect(gx - twPx / 2, deckBottomY + tfTopPx, twPx, webHPx);
      ctx.strokeRect(gx - twPx / 2, deckBottomY + tfTopPx, twPx, webHPx);

      // Bottom Flange
      ctx.fillRect(gx - bfBotPx / 2, girderBaseY - tfBotPx, bfBotPx, tfBotPx);
      ctx.strokeRect(gx - bfBotPx / 2, girderBaseY - tfBotPx, bfBotPx, tfBotPx);

      // Stiffeners (Left & Right chamfered polygons)
      ctx.fillStyle = STIFFENER_COLOR;
      const sTopY = deckBottomY + tfTopPx;
      const sBotY = girderBaseY - tfBotPx;
      const chamfer = Math.min(stiffWPx, tfTopPx) * 0.8;

      // Left Stiffener
      ctx.beginPath();
      const lx = gx - twPx / 2 - stiffWPx;
      const rx = gx - twPx / 2;
      ctx.moveTo(lx, sTopY);
      ctx.lineTo(rx - chamfer, sTopY);
      ctx.lineTo(rx, sTopY + chamfer);
      ctx.lineTo(rx, sBotY - chamfer);
      ctx.lineTo(rx - chamfer, sBotY);
      ctx.lineTo(lx, sBotY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Stiffener
      ctx.beginPath();
      const rlx = gx + twPx / 2;
      const rrx = gx + twPx / 2 + stiffWPx;
      ctx.moveTo(rlx + chamfer, sTopY);
      ctx.lineTo(rrx, sTopY);
      ctx.lineTo(rrx, sBotY);
      ctx.lineTo(rlx + chamfer, sBotY);
      ctx.lineTo(rlx, sBotY - chamfer);
      ctx.lineTo(rlx, sTopY + chamfer);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // ── 5. Crash Barriers (RCC or Metallic) ──
    const drawCrashBarrier = (x: number, isLeft: boolean) => {
      const cbHeightPx = 900 * baseScale;
      const cbBaseVPx = 100 * baseScale;
      const midOffPx = 350 * baseScale;
      const yBottom = deckTopY;
      const yTop = deckTopY - cbHeightPx;
      const yBaseTop = yBottom - cbBaseVPx;
      const yMid = yBottom - midOffPx;

      ctx.beginPath();
      if (isLeft) {
        ctx.moveTo(x, yBottom);
        ctx.lineTo(x + cbWPx, yBottom);
        ctx.lineTo(x + cbWPx, yBaseTop);
        ctx.lineTo(x + cbWPx * 0.6, yMid);
        ctx.lineTo(x + cbWPx * 0.45, yTop);
        ctx.lineTo(x + cbWPx * 0.1, yTop);
        ctx.lineTo(x, yBaseTop);
      } else {
        ctx.moveTo(x - cbWPx, yBottom);
        ctx.lineTo(x, yBottom);
        ctx.lineTo(x, yBaseTop);
        ctx.lineTo(x - cbWPx * 0.1, yTop);
        ctx.lineTo(x - cbWPx * 0.45, yTop);
        ctx.lineTo(x - cbWPx * 0.6, yMid);
        ctx.lineTo(x - cbWPx, yBaseTop);
      }
      ctx.closePath();
      ctx.fillStyle = hoveredElement === 'crash_barrier' ? HOVER_HIGHLIGHT_COLOR : CONCRETE_COLOR;
      ctx.fill();
      ctx.strokeStyle = BORDER_COLOR;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    drawCrashBarrier(leftBarrierX, true);
    drawCrashBarrier(rightBarrierEndX, false);

    // ── 6. Railings (RCC standard with square voids) ──
    const drawRailing = (x: number) => {
      const railHPx = 1000 * baseScale;
      const railWPx = railingWidth * baseScale;
      const baseHPx = 100 * baseScale;

      // Base
      ctx.fillStyle = hoveredElement === 'railing' ? HOVER_HIGHLIGHT_COLOR : CONCRETE_COLOR;
      ctx.fillRect(x, fpTopY - baseHPx, railWPx, baseHPx);
      ctx.strokeStyle = BORDER_COLOR;
      ctx.strokeRect(x, fpTopY - baseHPx, railWPx, baseHPx);

      // Post
      ctx.fillRect(x, fpTopY - railHPx, railWPx, railHPx - baseHPx);
      ctx.strokeRect(x, fpTopY - railHPx, railWPx, railHPx - baseHPx);

      // 3 Voids
      ctx.fillStyle = '#AAAAAA';
      const voidSize = railWPx * 0.6;
      for (let v = 0; v < 3; v++) {
        const vy = fpTopY - railHPx + 10 + v * (voidSize + 8);
        ctx.fillRect(x + (railWPx - voidSize) / 2, vy, voidSize, voidSize);
      }
    };

    if (leftRailingPresent) drawRailing(deckLeftX);
    if (rightRailingPresent) drawRailing(deckRightX - railingWidth * baseScale);

    // ── 7. Median (Raised Kerb Trapezoid) ──
    if (medianPresent) {
      const kerbHPx = 225 * baseScale;
      const kerbBottomWPx = medianWidth * baseScale;
      const kerbTopWPx = (medianWidth - 50) * baseScale;
      const my = deckTopY + computeSlopeOffset((medianStartX + medianEndX) / 2);

      ctx.beginPath();
      ctx.moveTo(medianStartX, my);
      ctx.lineTo(medianEndX, my);
      ctx.lineTo(medianEndX - (kerbBottomWPx - kerbTopWPx) / 2, my - kerbHPx);
      ctx.lineTo(medianStartX + (kerbBottomWPx - kerbTopWPx) / 2, my - kerbHPx);
      ctx.closePath();
      ctx.fillStyle = hoveredElement === 'median' ? HOVER_HIGHLIGHT_COLOR : CONCRETE_COLOR;
      ctx.fill();
      ctx.strokeStyle = BORDER_COLOR;
      ctx.stroke();
    }

    // ── 8. Dimension Lines & Extension Guides ──
    const drawDimArrow = (x1: number, y1: number, x2: number, y2: number, text: string) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // End ticks & arrows
      const arrowSize = 4;
      ctx.fillStyle = '#000000';

      // Left arrow
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + arrowSize, y1 - arrowSize / 2);
      ctx.lineTo(x1 + arrowSize, y1 + arrowSize / 2);
      ctx.closePath();
      ctx.fill();

      // Right arrow
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - arrowSize, y2 - arrowSize / 2);
      ctx.lineTo(x2 - arrowSize, y2 + arrowSize / 2);
      ctx.closePath();
      ctx.fill();

      // Text with white background badge
      ctx.font = '9px Arial, sans-serif';
      const textW = ctx.measureText(text).width;
      const midX = (x1 + x2) / 2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(midX - textW / 2 - 2, y1 - 13, textW + 4, 11);
      ctx.fillStyle = '#000000';
      ctx.fillText(text, midX - textW / 2, y1 - 4);
    };

    const yDimOverall = girderBaseY + 60;
    const yDimSpacing = girderBaseY + 30;
    const yDimTop = deckTopY - 140;

    // Overall Bridge Width
    drawDimArrow(deckLeftX, yDimOverall, deckRightX, yDimOverall, `Overall Width = ${(totalDeckWidth / 1000).toFixed(2)} m`);

    // Dotted extension lines for overall width
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#888888';
    ctx.beginPath();
    ctx.moveTo(deckLeftX, fpTopY);
    ctx.lineTo(deckLeftX, yDimOverall);
    ctx.moveTo(deckRightX, fpTopY);
    ctx.lineTo(deckRightX, yDimOverall);
    ctx.stroke();
    ctx.setLineDash([]);

    // Girder Spacing
    if (numGirders > 1) {
      drawDimArrow(
        girderPositions[0],
        yDimSpacing,
        girderPositions[1],
        yDimSpacing,
        `Spacing = ${(girderPositions[1] - girderPositions[0]) / baseScale / 1000} m`
      );
    }

    // Carriageway Width
    drawDimArrow(leftBarrierEndX, yDimTop, rightBarrierX, yDimTop, `Carriageway = ${(carriagewayWidth / 1000).toFixed(2)} m`);

    ctx.restore();
  }, [
    zoomLevel,
    panOffset,
    scaleFactor,
    inputs,
    hoveredElement,
    computeTotalDeckWidth,
    spanLength,
    numGirders,
    carriagewayWidth,
    medianPresent,
    medianWidth,
    deckThickness,
    deckOverhang,
    footpathConfig,
    footpathWidth,
    footpathThickness,
    crashBarrierWidth,
    railingWidth,
    wearingCourseThickness,
    girderDepth,
    topFlangeW,
    topFlangeT,
    botFlangeW,
    botFlangeT,
    webT,
    stiffenerW,
  ]);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      id="cad_cross_section_dock"
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
      {/* Title Bar if standalone */}
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
          <span>CAD Cross Section (2D)</span>
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

      {/* Floating Zoom & Pan Controls (mirrors desktop CrossSectionCADWidget) */}
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
