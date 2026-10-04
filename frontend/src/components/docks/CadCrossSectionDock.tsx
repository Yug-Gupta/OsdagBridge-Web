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
 *   - Concrete aggregate texture fill matching desktop create_concrete_brush()
 *   - Standard CAD dimension lines with arrows, extension lines, and labels
 *   - Interactive component hover detection with leader lines and tooltips
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

export interface CadCrossSectionDockProps {
  visible?: boolean;
  onClose?: () => void;
  isStandalone?: boolean;
  scaleFactor?: number;
}

// Shared CAD Palette matching desktop CrossSectionCADWidget
const GIRDER_COLOR = '#B3B4A0';
const STIFFENER_COLOR = '#D2D2CD';
const CROSS_BRACING_COLOR = '#EBECD3';
const RAILING_COLOR = '#D2D2D2';
const BARRIER_COLOR = '#DCDCDC';
const CONCRETE_COLOR = '#E1E1E1';
const ASPHALT_COLOR = '#282828';
const HOVER_HIGHLIGHT_COLOR = '#FFFADC';
const BORDER_COLOR = '#787878';

/**
 * Creates deterministic concrete aggregate texture tile matching desktop
 * CrossSectionCADWidget.create_concrete_brush() (seed = 42).
 */
function createConcretePattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  const SIZE = 120;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const pctx = canvas.getContext('2d');
  if (!pctx) return null;

  pctx.fillStyle = '#E1E1E1';
  pctx.fillRect(0, 0, SIZE, SIZE);

  // Seeded PRNG matching python random.Random(42)
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const rr = (min: number, max: number) => min + rand() * (max - min);

  const drawContent = (ox: number, oy: number) => {
    pctx.save();
    pctx.translate(ox, oy);

    // Fine aggregate dots (100)
    for (let i = 0; i < 100; i++) {
      const x = rr(0, SIZE);
      const y = rr(0, SIZE);
      const r = rr(0.6, 2.2);
      const h = Math.floor(rr(40, 110));
      pctx.fillStyle = `rgb(${h},${h},${h})`;
      pctx.beginPath();
      pctx.arc(x, y, r, 0, Math.PI * 2);
      pctx.fill();
    }

    // Coarse aggregate irregular triangles (30)
    for (let i = 0; i < 30; i++) {
      const cx = rr(0, SIZE);
      const cy = rr(0, SIZE);
      const baseAngle = rr(0, 2 * Math.PI);
      const h = Math.floor(rr(70, 140));
      const sat = Math.floor(rr(0, 10));

      pctx.beginPath();
      for (let v = 0; v < 3; v++) {
        const ang = baseAngle + v * (2 * Math.PI / 3) + rr(-0.45, 0.45);
        const dist = rr(SIZE * 0.032, SIZE * 0.072);
        const px = cx + Math.cos(ang) * dist;
        const py = cy + Math.sin(ang) * dist;
        if (v === 0) pctx.moveTo(px, py);
        else pctx.lineTo(px, py);
      }
      pctx.closePath();
      pctx.fillStyle = `rgb(${h + sat},${h},${h - sat})`;
      pctx.fill();
      const alpha = rr(0.25, 0.55);
      pctx.strokeStyle = `rgba(20, 20, 20, ${alpha})`;
      pctx.lineWidth = rr(0.4, 0.8);
      pctx.stroke();
    }

    // Micro-scratches
    const scratchCount = Math.floor(SIZE * 0.3);
    for (let i = 0; i < scratchCount; i++) {
      const x = rr(0, SIZE);
      const y = rr(0, SIZE);
      const len = rr(2, SIZE * 0.08);
      const ang = rr(0, Math.PI * 2);
      const alpha = rr(0.04, 0.12);
      pctx.strokeStyle = `rgba(90, 85, 80, ${alpha})`;
      pctx.lineWidth = rr(0.3, 0.7);
      pctx.beginPath();
      pctx.moveTo(x, y);
      pctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      pctx.stroke();
    }

    pctx.restore();
  };

  // Draw 9 copies for seamless tiling
  for (const dx of [-SIZE, 0, SIZE]) {
    for (const dy of [-SIZE, 0, SIZE]) {
      drawContent(dx, dy);
    }
  }

  // Subtle unifying wash
  pctx.fillStyle = 'rgba(100, 95, 88, 0.04)';
  pctx.fillRect(0, 0, SIZE, SIZE);

  return ctx.createPattern(canvas, 'repeat');
}

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

  // ── Compute parameters from store inputs ──
  // Always use CAD fallback defaults when inputs are blank (mirrors desktop cad_cross_section.py)
  const spanLength = getSpan(inputs) * 1000; // mm (35,000)
  const numGirders = Math.max(1, getNoOfGirders(inputs, additionalInputs)); // 4
  const carriagewayWidth = getCarriagewayWidth(inputs) * 1000; // mm (10,500)
  const girderSpacing = getGirderSpacing(inputs, additionalInputs) * 1000; // mm (2,750)
  const deckOverhang = getDeckOverhang(inputs, additionalInputs) * 1000; // mm (1,000)
  const deckThickness = CAD_DEFAULTS.DECK_THICKNESS_MM; // mm (200)
  const medianPresent = inputs[INPUT_KEYS.includeMedian] === 'Yes'; // false by default
  const medianWidth = 1200; // mm

  const footpathConfig = (() => {
    const fp = inputs[INPUT_KEYS.footpath];
    if (fp === 'None' || fp === 'none') return 'none';
    if (fp === 'Single Side') return 'left';
    if (fp === 'Both Sides') return 'both';
    return 'both'; // Desktop default is 'both'
  })() as 'both' | 'left' | 'right' | 'none';

  const footpathWidth = 1500; // mm
  const footpathThickness = 200; // mm
  const crashBarrierWidth = 500; // mm
  const railingWidth = 375; // mm
  const wearingCourseThickness = 50; // mm

  // Flags: did the user explicitly enter a value, or are we showing CAD fallback labels?
  const userHasCarriageway = hasUserCarriagewayWidth(inputs);

  // Girder dimensions & visual scale (mirrors desktop CrossSectionCADWidget)
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

    // Clear background to solid white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Create concrete texture pattern
    const concretePattern = createConcretePattern(ctx) || CONCRETE_COLOR;

    // Viewport-fit scaling matching desktop compute_fit_zoom
    const totalDeckWidth = computeTotalDeckWidth();
    const modelH = girderDepth * visualScale.depth + deckThickness + footpathThickness + 800;

    const PADDING = 0.15; // 15% margin matching desktop
    const availW = width * (1.0 - 2 * PADDING);
    const availH = height * (1.0 - 2 * PADDING);
    const baseScale = Math.min(availW / totalDeckWidth, availH / modelH);

    // Centering calculations matching desktop base_y
    const centerX = width / 2;
    const centerY = height / 2;
    const girderDepthVisual = girderDepth * baseScale * visualScale.depth;
    const deckThickPx = deckThickness * baseScale;
    const fpThickPx = footpathThickness * baseScale;
    const wcThickPx = wearingCourseThickness * baseScale;

    const totalBridgeHeight =
      girderDepthVisual + deckThickPx + fpThickPx + 800 * baseScale + 1000 * baseScale;
    const baseY = (height + totalBridgeHeight) / 2 - 70;

    const girderTopY = baseY - girderDepthVisual;
    const deckBottomY = girderTopY;
    const deckTopY = deckBottomY - deckThickPx;
    const fpBottomY = deckBottomY;
    const fpTopY = fpBottomY - fpThickPx;

    // Layout from Left to Right
    const deckStartX = centerX - (totalDeckWidth * baseScale) / 2;
    const deckLeftX = deckStartX;
    const deckRightX = deckStartX + totalDeckWidth * baseScale;

    const leftRailingPresent = footpathConfig === 'both' || footpathConfig === 'left';
    const rightRailingPresent = footpathConfig === 'both' || footpathConfig === 'right';

    const leftRailWPx = leftRailingPresent ? railingWidth * baseScale : 0;
    const rightRailWPx = rightRailingPresent ? railingWidth * baseScale : 0;
    const leftFpWPx = leftRailingPresent ? footpathWidth * baseScale : 0;
    const rightFpWPx = rightRailingPresent ? footpathWidth * baseScale : 0;
    const cbWPx = crashBarrierWidth * baseScale;

    const leftFpX = deckLeftX + leftRailWPx;
    const leftBarrierX = leftFpX + leftFpWPx;
    const leftBarrierEndX = leftBarrierX + cbWPx;

    const rightFpX = deckRightX - rightRailWPx - rightFpWPx;
    const rightBarrierEndX = rightFpX;
    const rightBarrierX = rightBarrierEndX - cbWPx;

    let carriagewayStartX = leftBarrierEndX;
    let carriagewayEndX = rightBarrierX;
    let medianStartX = 0;
    let medianEndX = 0;

    if (medianPresent) {
      const cwWidthPx = carriagewayWidth * baseScale;
      const medianWPx = medianWidth * baseScale;
      medianStartX = leftBarrierEndX + cwWidthPx;
      medianEndX = medianStartX + medianWPx;
      carriagewayStartX = leftBarrierEndX;
      carriagewayEndX = medianEndX + cwWidthPx;
    }

    const slopeStartX = carriagewayStartX;
    const slopeEndX = carriagewayEndX;

    const computeSlopeOffset = (x: number) => {
      if (x < slopeStartX || x > slopeEndX) return 0;
      const mid = (slopeStartX + slopeEndX) / 2;
      const span = Math.max(1, slopeEndX - slopeStartX);
      const xi = (x - mid) / (span / 2);
      const slopeHeight = 0.005 * (span / 2);
      return -slopeHeight * (1.0 - xi * xi);
    };

    // Girder horizontal locations
    const deckOverhangPx = deckOverhang * baseScale;
    let positions: number[] = [];
    if (numGirders > 1) {
      const firstGirderX = deckLeftX + deckOverhangPx;
      const lastGirderX = deckRightX - deckOverhangPx;
      const actualSpacingPx = (lastGirderX - firstGirderX) / (numGirders - 1);
      positions = Array.from({ length: numGirders }, (_, i) => firstGirderX + i * actualSpacingPx);
    } else {
      positions = [centerX];
    }

    // Apply smooth pan & zoom transformations centered at (centerX, centerY)
    ctx.save();
    ctx.translate(centerX + panOffset.x, centerY + panOffset.y);
    ctx.scale(zoomLevel * scaleFactor, zoomLevel * scaleFactor);
    ctx.translate(-centerX, -centerY);

    // ── 1. Draw Concrete Deck Slab (Curved polygon matching desktop) ──
    const numPts = 50;
    const topPts: { x: number; y: number }[] = [];
    const botPts: { x: number; y: number }[] = [];

    const leftFpBoundary = leftFpWPx > 0 ? leftBarrierX : null;
    const rightFpBoundary = rightFpWPx > 0 ? rightBarrierEndX : null;

    const mainStart = leftFpBoundary !== null ? leftFpBoundary : deckLeftX;
    const mainEnd = rightFpBoundary !== null ? rightFpBoundary : deckRightX;

    // Left footpath flat top
    if (leftFpBoundary !== null) {
      topPts.push({ x: deckLeftX, y: fpTopY });
      topPts.push({ x: leftFpBoundary, y: fpTopY });
      topPts.push({ x: leftFpBoundary, y: deckTopY });
    }

    // Main carriageway top curve with parabolic camber
    for (let i = 0; i <= numPts; i++) {
      const x = mainStart + (i * (mainEnd - mainStart)) / numPts;
      const y = deckTopY + computeSlopeOffset(x);
      topPts.push({ x, y });
    }

    // Right footpath flat top
    if (rightFpBoundary !== null) {
      topPts.push({ x: rightFpBoundary, y: deckTopY });
      topPts.push({ x: rightFpBoundary, y: fpTopY });
      topPts.push({ x: deckRightX, y: fpTopY });
    }

    // Bottom edge
    botPts.push({ x: deckRightX, y: deckBottomY });
    botPts.push({ x: deckLeftX, y: deckBottomY });

    ctx.beginPath();
    ctx.moveTo(topPts[0].x, topPts[0].y);
    topPts.forEach((p) => ctx.lineTo(p.x, p.y));
    botPts.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.closePath();

    ctx.fillStyle = hoveredElement === 'deck' ? '#F0F0F0' : concretePattern;
    ctx.fill();

    // Solid outline of deck slab
    ctx.strokeStyle = BORDER_COLOR;
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // ── 2. Wearing Course Asphalt Layer (Curved) ──
    if (wcThickPx > 0) {
      const drawWearingSegment = (xStart: number, xEnd: number) => {
        if (xEnd <= xStart) return;
        ctx.beginPath();
        for (let i = 0; i <= 30; i++) {
          const x = xStart + (i * (xEnd - xStart)) / 30;
          const y = deckTopY + computeSlopeOffset(x) - wcThickPx;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        for (let i = 30; i >= 0; i--) {
          const x = xStart + (i * (xEnd - xStart)) / 30;
          const y = deckTopY + computeSlopeOffset(x);
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = ASPHALT_COLOR;
        ctx.fill();
      };

      const renderedCbWPx = 450 * baseScale;
      const leftBarrierVisualEnd = leftBarrierX + renderedCbWPx;
      const rightBarrierVisualStart = rightBarrierEndX - renderedCbWPx;

      if (medianPresent && medianStartX > 0 && medianEndX > 0) {
        drawWearingSegment(leftBarrierVisualEnd, medianStartX);
        drawWearingSegment(medianEndX, rightBarrierVisualStart);
      } else {
        drawWearingSegment(leftBarrierVisualEnd, rightBarrierVisualStart);
      }
    }

    // ── 3. Girders & Stiffeners (I-sections with chamfers) ──
    const tfTopPx = topFlangeT * baseScale * visualScale.flangeThickness;
    const tfBotPx = botFlangeT * baseScale * visualScale.flangeThickness;
    const bfTopPx = topFlangeW * baseScale * visualScale.flangeWidth;
    const bfBotPx = botFlangeW * baseScale * visualScale.flangeWidth;
    const twPx = webT * baseScale * visualScale.webThickness;
    const stiffWPx = stiffenerW * baseScale;

    positions.forEach((gx, idx) => {
      const isGirderHovered = hoveredElement === `girder-${idx}` || hoveredElement === 'girder';
      ctx.fillStyle = isGirderHovered ? '#FFFADC' : GIRDER_COLOR;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.2;

      // Bottom Flange
      ctx.fillRect(gx - bfBotPx / 2, baseY - tfBotPx, bfBotPx, tfBotPx);
      ctx.strokeRect(gx - bfBotPx / 2, baseY - tfBotPx, bfBotPx, tfBotPx);

      // Web
      const webHPx = girderDepthVisual - tfTopPx - tfBotPx;
      ctx.fillRect(gx - twPx / 2, baseY - girderDepthVisual + tfTopPx, twPx, webHPx);
      ctx.strokeRect(gx - twPx / 2, baseY - girderDepthVisual + tfTopPx, twPx, webHPx);

      // Top Flange
      ctx.fillRect(gx - bfTopPx / 2, baseY - girderDepthVisual, bfTopPx, tfTopPx);
      ctx.strokeRect(gx - bfTopPx / 2, baseY - girderDepthVisual, bfTopPx, tfTopPx);

      // Stiffeners (chamfered polygons matching desktop draw_stiffeners)
      ctx.fillStyle = STIFFENER_COLOR;
      const sTopY = baseY - girderDepthVisual + tfTopPx;
      const sBotY = baseY - tfBotPx;
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

    // ── 4. Cross Bracing (X-Bracing with true vector geometry) ──
    if (numGirders > 1) {
      const halfWeb = twPx / 2;
      const thickness = Math.max(2, 3.5 * (zoomLevel / 1.2));

      for (let i = 0; i < numGirders - 1; i++) {
        const x1 = positions[i] + halfWeb;
        const x2 = positions[i + 1] - halfWeb;

        const topL = baseY - girderDepthVisual + tfTopPx + 0.02 * girderDepthVisual;
        const bottomL = baseY - tfBotPx + 0.02 * girderDepthVisual;
        const topR = topL;
        const bottomR = bottomL;

        const dx = x2 - x1;

        // Diagonal \
        const dyBs = bottomR - topL;
        const lBs = Math.hypot(dx, dyBs);
        if (lBs > 0) {
          const perpX = (-dyBs / lBs) * (thickness / 2);
          const perpY = (dx / lBs) * (thickness / 2);

          ctx.beginPath();
          ctx.moveTo(x1 + perpX, topL + perpY);
          ctx.lineTo(x2 + perpX, bottomR + perpY);
          ctx.lineTo(x2 - perpX, bottomR - perpY);
          ctx.lineTo(x1 - perpX, topL - perpY);
          ctx.closePath();
          ctx.fillStyle = CROSS_BRACING_COLOR;
          ctx.fill();
          ctx.strokeStyle = '#999977';
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }

        // Diagonal /
        const dySl = topR - bottomL;
        const lSl = Math.hypot(dx, dySl);
        if (lSl > 0) {
          const perpX = (-dySl / lSl) * (thickness / 2);
          const perpY = (dx / lSl) * (thickness / 2);

          ctx.beginPath();
          ctx.moveTo(x1 + perpX, bottomL + perpY);
          ctx.lineTo(x2 + perpX, topR + perpY);
          ctx.lineTo(x2 - perpX, topR - perpY);
          ctx.lineTo(x1 - perpX, bottomL - perpY);
          ctx.closePath();
          ctx.fillStyle = CROSS_BRACING_COLOR;
          ctx.fill();
          ctx.strokeStyle = '#999977';
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }
      }
    }

    // ── 5. Railings (IRC:5 RCC with square voids) ──
    const drawRccRailing = (x: number) => {
      const railHPx = 1000 * baseScale;
      const railWPx = railingWidth * baseScale;
      const baseHPx = 100 * baseScale;

      // Base
      ctx.fillStyle = hoveredElement === 'railing' ? HOVER_HIGHLIGHT_COLOR : concretePattern;
      ctx.fillRect(x, fpTopY - baseHPx, railWPx, baseHPx);
      ctx.strokeStyle = BORDER_COLOR;
      ctx.lineWidth = 1.0;
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

    if (leftRailingPresent) drawRccRailing(deckLeftX);
    if (rightRailingPresent) drawRccRailing(deckRightX - railingWidth * baseScale);

    // ── 6. Crash Barriers (IRC 5 RCC geometry) ──
    const drawCrashBarrier = (x: number, isLeft: boolean) => {
      const TOTAL_HEIGHT = 900.0;
      const BOTTOM_WIDTH = 450.0;
      const BASE_VERTICAL = 100.0;
      const MID_OFFSET = 350.0;

      const h = TOTAL_HEIGHT * baseScale;
      const bottomW = BOTTOM_WIDTH * baseScale;
      const baseV = BASE_VERTICAL * baseScale;

      const yBottom = deckTopY;
      const yBaseTop = yBottom - baseV;
      const yMid = yBottom - MID_OFFSET * baseScale;
      const yTop = yBottom - h;

      const shapeScale = BOTTOM_WIDTH / 525.0;
      const rightAtMid = 300 * baseScale * shapeScale;
      const leftAtTop = 50 * baseScale * shapeScale;
      const rightAtTop = 225 * baseScale * shapeScale;

      ctx.beginPath();
      if (isLeft) {
        ctx.moveTo(x, yBottom);
        ctx.lineTo(x + bottomW, yBottom);
        ctx.lineTo(x + bottomW, yBaseTop);
        ctx.lineTo(x + rightAtMid, yMid);
        ctx.lineTo(x + rightAtTop, yTop);
        ctx.lineTo(x + leftAtTop, yTop);
        ctx.lineTo(x, yBaseTop);
      } else {
        ctx.moveTo(x - bottomW, yBottom);
        ctx.lineTo(x, yBottom);
        ctx.lineTo(x, yBaseTop);
        ctx.lineTo(x - leftAtTop, yTop);
        ctx.lineTo(x - rightAtTop, yTop);
        ctx.lineTo(x - rightAtMid, yMid);
        ctx.lineTo(x - bottomW, yBaseTop);
      }
      ctx.closePath();

      ctx.fillStyle = hoveredElement === 'crash_barrier' ? HOVER_HIGHLIGHT_COLOR : concretePattern;
      ctx.fill();
      ctx.strokeStyle = BORDER_COLOR;
      ctx.lineWidth = Math.max(1.0, baseScale * 1.5);
      ctx.stroke();
    };

    drawCrashBarrier(leftBarrierX, true);
    drawCrashBarrier(rightBarrierEndX, false);

    // ── 7. Median (if enabled) ──
    if (medianPresent && medianStartX > 0 && medianEndX > 0) {
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
      ctx.fillStyle = hoveredElement === 'median' ? HOVER_HIGHLIGHT_COLOR : concretePattern;
      ctx.fill();
      ctx.strokeStyle = BORDER_COLOR;
      ctx.stroke();
    }

    // ── 8. Dimension Lines & Extension Guides (matching desktop styling) ──
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
      const totalHeight = lines.length * lineHeight;
      const maxWidth = Math.max(...lines.map((l) => ctx.measureText(l).width));
      const padding = 2;

      let bgX = x - maxWidth / 2 - padding;
      if (align === 'left') bgX = x - padding;
      else if (align === 'right') bgX = x - maxWidth - padding;
      const bgY = y - totalHeight / 2 - padding;

      ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
      ctx.fillRect(bgX, bgY, maxWidth + 2 * padding, totalHeight + 2 * padding);

      ctx.fillStyle = '#000000';
      const startY = y - totalHeight / 2 + lineHeight / 2;
      lines.forEach((line, i) => {
        ctx.fillText(line, x, startY + i * lineHeight);
      });
    };

    const drawDimensionArrow = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      text: string,
      extDir: 'up' | 'down' | 'none' = 'none',
      extEndY?: number,
      textOffset = 0
    ) => {
      ctx.save();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.8;

      // Main line
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // End ticks
      const tickLen = 6;
      ctx.beginPath();
      ctx.moveTo(x1, y1 - tickLen / 2);
      ctx.lineTo(x1, y1 + tickLen / 2);
      ctx.moveTo(x2, y2 - tickLen / 2);
      ctx.lineTo(x2, y2 + tickLen / 2);
      ctx.stroke();

      // Arrowheads (4px x 2px)
      const arrowSize = 4;
      const arrowHalf = 2;
      ctx.fillStyle = '#000000';

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + arrowSize, y1 - arrowHalf);
      ctx.lineTo(x1 + arrowSize, y1 + arrowHalf);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - arrowSize, y2 - arrowHalf);
      ctx.lineTo(x2 - arrowSize, y2 + arrowHalf);
      ctx.closePath();
      ctx.fill();

      // Extension lines
      if (extDir !== 'none' && extEndY !== undefined) {
        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = '#646464';
        ctx.lineWidth = 0.8;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1, extEndY);
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2, extEndY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (text) {
        const midX = (x1 + x2) / 2;
        const textY = extDir === 'down' ? y1 + 14 + textOffset : y1 - 8 + textOffset;
        drawTextWithBg(text, midX, textY);
      }
      ctx.restore();
    };

    const drawVerticalDimensionArrow = (
      x: number,
      y1: number,
      y2: number,
      text: string,
      side: 'left' | 'right' = 'left'
    ) => {
      ctx.save();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.8;

      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.stroke();

      const tickLen = 4;
      ctx.beginPath();
      ctx.moveTo(x - tickLen, y1);
      ctx.lineTo(x + tickLen, y1);
      ctx.moveTo(x - tickLen, y2);
      ctx.lineTo(x + tickLen, y2);
      ctx.stroke();

      const arrowSize = 3.5;
      const arrowHalf = 1.5;
      ctx.fillStyle = '#000000';

      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.lineTo(x - arrowHalf, y1 + arrowSize);
      ctx.lineTo(x + arrowHalf, y1 + arrowSize);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x, y2);
      ctx.lineTo(x - arrowHalf, y2 - arrowSize);
      ctx.lineTo(x + arrowHalf, y2 - arrowSize);
      ctx.closePath();
      ctx.fill();

      if (text) {
        const textX = side === 'left' ? x - 8 : x + 8;
        const midY = (y1 + y2) / 2;
        drawTextWithBg(text, textX, midY, { align: side === 'left' ? 'right' : 'left' });
      }
      ctx.restore();
    };

    // ── LEVEL 1 (Bottom): Overall Bridge Width ──
    const Y_OVERALL = baseY + 70;
    const overallWidthM = totalDeckWidth / 1000;
    const labelOverall = userHasCarriageway
      ? `Overall Bridge Width = ${overallWidthM.toFixed(2)} m`
      : 'Overall Bridge Width';
    drawDimensionArrow(deckLeftX, Y_OVERALL, deckRightX, Y_OVERALL, labelOverall, 'up', fpTopY);

    // ── LEVEL 2 (Bottom): Overhang ──
    const Y_OVERHANG = baseY + 35;
    const overhangM = deckOverhang / 1000;
    const labelOverhang = userHasCarriageway
      ? `Overhang = ${overhangM.toFixed(2)} m`
      : 'Overhang';
    if (positions.length > 0) {
      drawDimensionArrow(deckLeftX, Y_OVERHANG, positions[0], Y_OVERHANG, labelOverhang, 'up', deckBottomY);
    }

    // ── LEVEL 2 (Bottom): Girder Spacing ──
    const Y_GIRDER_SPACING = baseY + 35;
    const gsM = (girderSpacing || 2750) / 1000;
    const labelGs = userHasCarriageway
      ? `Girder Spacing = ${gsM.toFixed(2)} m`
      : 'Girder Spacing';
    if (numGirders > 1 && positions.length >= 2) {
      // Shift to second pair if available to avoid overlap with overhang label (matching desktop)
      const xLeft = numGirders > 2 ? positions[1] : positions[0];
      const xRight = numGirders > 2 ? positions[2] : positions[1];
      drawDimensionArrow(xLeft, Y_GIRDER_SPACING, xRight, Y_GIRDER_SPACING, labelGs, 'up', baseY);
    }

    // ── LEVEL 3 (Middle): Deck Thickness ──
    const deckCenterXM = (leftBarrierX + rightBarrierEndX) / 2;
    const localDeckTopYM = deckTopY + computeSlopeOffset(deckCenterXM);
    const labelDt = userHasCarriageway
      ? `Deck Thickness = ${deckThickness.toFixed(0)} mm`
      : 'Deck Thickness';

    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(deckCenterXM, localDeckTopYM);
    ctx.lineTo(deckCenterXM, deckBottomY);
    ctx.stroke();

    const dtTick = 4;
    ctx.beginPath();
    ctx.moveTo(deckCenterXM - dtTick, localDeckTopYM);
    ctx.lineTo(deckCenterXM + dtTick, localDeckTopYM);
    ctx.moveTo(deckCenterXM - dtTick, deckBottomY);
    ctx.lineTo(deckCenterXM + dtTick, deckBottomY);
    ctx.stroke();

    const dtArrowSize = 3.5;
    const dtArrowHalf = 1.75;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(deckCenterXM, localDeckTopYM);
    ctx.lineTo(deckCenterXM - dtArrowHalf, localDeckTopYM + dtArrowSize);
    ctx.lineTo(deckCenterXM + dtArrowHalf, localDeckTopYM + dtArrowSize);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(deckCenterXM, deckBottomY);
    ctx.lineTo(deckCenterXM - dtArrowHalf, deckBottomY - dtArrowSize);
    ctx.lineTo(deckCenterXM + dtArrowHalf, deckBottomY - dtArrowSize);
    ctx.closePath();
    ctx.fill();

    drawTextWithBg(labelDt, deckCenterXM, localDeckTopYM - 8, { align: 'center' });
    ctx.restore();

    // ── LEVEL 4 (Top): Footpath Width & Carriageway Width ──
    const Y_TOP_COMMON = deckTopY - 35;

    if (leftRailingPresent && leftFpWPx > 0) {
      const labelFp = userHasCarriageway
        ? `Footpath Width = ${(footpathWidth / 1000).toFixed(2)} m`
        : 'Footpath Width';
      drawDimensionArrow(leftFpX, Y_TOP_COMMON, leftBarrierX, Y_TOP_COMMON, labelFp, 'down', fpTopY);
    }

    const renderedCbWPx = 450 * baseScale;
    const leftBarrierVisualEnd = leftBarrierX + renderedCbWPx;
    const rightBarrierVisualStart = rightBarrierEndX - renderedCbWPx;
    const cwM = carriagewayWidth / 1000;
    const labelCw = userHasCarriageway
      ? `Carriageway Width = ${cwM.toFixed(2)} m`
      : 'Carriageway Width';
    drawDimensionArrow(leftBarrierVisualEnd, Y_TOP_COMMON, rightBarrierVisualStart, Y_TOP_COMMON, labelCw, 'down', deckTopY);

    if (rightRailingPresent && rightFpWPx > 0) {
      const labelFp = userHasCarriageway
        ? `Footpath Width = ${(footpathWidth / 1000).toFixed(2)} m`
        : 'Footpath Width';
      drawDimensionArrow(rightBarrierEndX, Y_TOP_COMMON, deckRightX - rightRailWPx, Y_TOP_COMMON, labelFp, 'down', fpTopY);
    }

    // Footpath Thickness
    if (leftRailingPresent && leftFpWPx > 0) {
      const labelFt = userHasCarriageway
        ? `Footpath\nThickness\n= ${footpathThickness.toFixed(0)} mm`
        : 'Footpath\nThickness';
      drawVerticalDimensionArrow(deckLeftX - 8, fpTopY, deckBottomY, labelFt, 'left');
    }

    ctx.restore();
  }, [
    zoomLevel,
    panOffset,
    scaleFactor,
    inputs,
    additionalInputs,
    hoveredElement,
    computeTotalDeckWidth,
    spanLength,
    numGirders,
    carriagewayWidth,
    girderSpacing,
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
    userHasCarriageway,
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
