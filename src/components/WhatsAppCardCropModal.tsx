import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  RotateCw,
  RotateCcw,
  Wand2,
  Sparkles,
  Target,
  Crop,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  CreditCard,
  FileText,
  User,
  Maximize2,
  ShieldCheck,
  Eye
} from 'lucide-react';
import {
  CornerPoints,
  CropRect,
  detectDocumentCorners,
  warpPerspectiveCanvas,
  cropRectCanvas,
  FilterOptions
} from '../utils/perspectiveUtils';

interface WhatsAppCardCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropSave: (croppedDataUrl: string) => void;
  cardLabel?: string;
  initialMode?: 'perspective' | 'standard';
}

type CropToolMode = 'standard' | 'perspective';
type FilterMode = 'original' | 'magic' | 'bw';
type DocumentPreset = 'card' | 'a4' | 'passport' | 'free';

export const WhatsAppCardCropModal: React.FC<WhatsAppCardCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropSave,
  cardLabel = 'डॉक्युमेंट क्रॉप',
  initialMode = 'standard'
}) => {
  const [toolMode, setToolMode] = useState<CropToolMode>(initialMode);
  const [docPreset, setDocPreset] = useState<DocumentPreset>('card');
  // Default to 'original' mode: 100% pristine original colors, sharp text, NO blown-out white!
  const [filterMode, setFilterMode] = useState<FilterMode>('original');
  const [rotationAngle, setRotationAngle] = useState<number>(0);

  // Perspective 4 corners
  const [corners, setCorners] = useState<CornerPoints>({
    tl: { x: 0, y: 0 },
    tr: { x: 0, y: 0 },
    br: { x: 0, y: 0 },
    bl: { x: 0, y: 0 },
  });

  // Standard crop rectangle (x, y, width, height)
  const [cropRect, setCropRect] = useState<CropRect>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });

  // Active interaction drag state
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; rect: CropRect } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load Image and initialize default crops
  useEffect(() => {
    if (!imageSrc || !isOpen) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      const nw = img.naturalWidth || img.width;
      const nh = img.naturalHeight || img.height;

      // Initialize Perspective corners (inset 4%)
      setCorners(detectDocumentCorners(nw, nh, 0.04));

      // Initialize Standard Crop Box (centered based on card ratio)
      const ratio = 85.6 / 54; // default PVC card ratio
      let initW = nw * 0.88;
      let initH = initW / ratio;
      if (initH > nh * 0.88) {
        initH = nh * 0.88;
        initW = initH * ratio;
      }

      const padX = Math.round((nw - initW) / 2);
      const padY = Math.round((nh - initH) / 2);

      setCropRect({
        x: padX,
        y: padY,
        width: Math.round(initW),
        height: Math.round(initH),
      });

      setRotationAngle(0);
    };
  }, [imageSrc, isOpen]);

  // Target HD dimensions calculation with accurate aspect ratio
  const getTargetDimensions = useCallback(() => {
    if (toolMode === 'standard') {
      // Standard crop: 1:1 original crisp pixels from the selected crop area!
      // NEVER squishes or stretches the photo!
      return {
        w: Math.max(100, Math.round(cropRect.width)),
        h: Math.max(100, Math.round(cropRect.height)),
      };
    }

    // Perspective unwarp: calculate true physical dimensions from corner lengths
    const topLen = Math.hypot(corners.tr.x - corners.tl.x, corners.tr.y - corners.tl.y);
    const botLen = Math.hypot(corners.br.x - corners.bl.x, corners.br.y - corners.bl.y);
    const leftLen = Math.hypot(corners.bl.x - corners.tl.x, corners.bl.y - corners.tl.y);
    const rightLen = Math.hypot(corners.br.x - corners.tr.x, corners.br.y - corners.tr.y);

    const naturalW = Math.max(topLen, botLen);
    const naturalH = Math.max(leftLen, rightLen);

    switch (docPreset) {
      case 'card': {
        // PVC Card (85.6 x 54mm) -> 1.585 aspect ratio
        const w = Math.round(Math.max(1200, Math.min(2200, naturalW)));
        const h = Math.round(w / 1.585185);
        return { w, h };
      }
      case 'a4': {
        // A4 ratio 1 : 1.4142
        const w = Math.round(Math.max(1200, Math.min(2200, naturalW)));
        const h = Math.round(w * 1.4142);
        return { w, h };
      }
      case 'passport': {
        // 35 x 45mm ratio
        const h = Math.round(Math.max(900, Math.min(1800, naturalH)));
        const w = Math.round(h * (35 / 45));
        return { w, h };
      }
      case 'free':
      default: {
        return {
          w: Math.round(Math.max(400, Math.min(2400, naturalW))),
          h: Math.round(Math.max(300, Math.min(2400, naturalH))),
        };
      }
    }
  }, [docPreset, toolMode, cropRect, corners]);

  // Apply Document Presets to Crop Selection
  const applyPreset = (preset: DocumentPreset) => {
    setDocPreset(preset);
    if (!imgRef.current) return;
    const nw = imgRef.current.naturalWidth || imgRef.current.width;
    const nh = imgRef.current.naturalHeight || imgRef.current.height;

    let targetRatio: number | null = null;
    if (preset === 'card') targetRatio = 85.6 / 54;
    else if (preset === 'a4') targetRatio = 1 / 1.4142;
    else if (preset === 'passport') targetRatio = 35 / 45;

    if (targetRatio && toolMode === 'standard') {
      let newW = nw * 0.85;
      let newH = newW / targetRatio;
      if (newH > nh * 0.85) {
        newH = nh * 0.85;
        newW = newH * targetRatio;
      }
      const newX = Math.round((nw - newW) / 2);
      const newY = Math.round((nh - newH) / 2);
      setCropRect({
        x: newX,
        y: newY,
        width: Math.round(newW),
        height: Math.round(newH),
      });
    }
  };

  // 1-Click Auto Fit
  const handleAutoFit = () => {
    if (!imgRef.current) return;
    const nw = imgRef.current.naturalWidth || imgRef.current.width;
    const nh = imgRef.current.naturalHeight || imgRef.current.height;

    setCorners(detectDocumentCorners(nw, nh, 0.04));

    const padX = Math.round(nw * 0.04);
    const padY = Math.round(nh * 0.04);
    setCropRect({
      x: padX,
      y: padY,
      width: nw - padX * 2,
      height: nh - padY * 2,
    });
  };

  // Reset to full bounds
  const handleReset = () => {
    if (!imgRef.current) return;
    const nw = imgRef.current.naturalWidth || imgRef.current.width;
    const nh = imgRef.current.naturalHeight || imgRef.current.height;

    setCorners({
      tl: { x: 0, y: 0 },
      tr: { x: nw, y: 0 },
      br: { x: nw, y: nh },
      bl: { x: 0, y: nh },
    });

    setCropRect({
      x: 0,
      y: 0,
      width: nw,
      height: nh,
    });
  };

  // Render Canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nw = img.naturalWidth || img.width;
    const nh = img.naturalHeight || img.height;

    const pad = 40;
    canvas.width = nw + pad * 2;
    canvas.height = nh + pad * 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(pad, pad);

    // Draw base image
    ctx.drawImage(img, 0, 0);

    if (toolMode === 'perspective') {
      // ================= PERSPECTIVE CROP RENDER =================
      // 1. Subtle transparent tint outside quadrilateral (NO dark black box)
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
      ctx.fillRect(0, 0, nw, nh);

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(corners.tl.x, corners.tl.y);
      ctx.lineTo(corners.tr.x, corners.tr.y);
      ctx.lineTo(corners.br.x, corners.br.y);
      ctx.lineTo(corners.bl.x, corners.bl.y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 2. Interior subtle tint
      ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.beginPath();
      ctx.moveTo(corners.tl.x, corners.tl.y);
      ctx.lineTo(corners.tr.x, corners.tr.y);
      ctx.lineTo(corners.br.x, corners.br.y);
      ctx.lineTo(corners.bl.x, corners.bl.y);
      ctx.closePath();
      ctx.fill();

      // 3. Photoshop Perspective Grid Mesh (lines between opposite edges)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = Math.max(1.5, Math.round(nw / 600));
      const gridSteps = 3;
      for (let i = 1; i < gridSteps; i++) {
        const u = i / gridSteps;
        const pTop = {
          x: corners.tl.x + u * (corners.tr.x - corners.tl.x),
          y: corners.tl.y + u * (corners.tr.y - corners.tl.y),
        };
        const pBot = {
          x: corners.bl.x + u * (corners.br.x - corners.bl.x),
          y: corners.bl.y + u * (corners.br.y - corners.bl.y),
        };
        ctx.beginPath();
        ctx.moveTo(pTop.x, pTop.y);
        ctx.lineTo(pBot.x, pBot.y);
        ctx.stroke();

        const pLeft = {
          x: corners.tl.x + u * (corners.bl.x - corners.tl.x),
          y: corners.tl.y + u * (corners.bl.y - corners.tl.y),
        };
        const pRight = {
          x: corners.tr.x + u * (corners.br.x - corners.tr.x),
          y: corners.tr.y + u * (corners.br.y - corners.tr.y),
        };
        ctx.beginPath();
        ctx.moveTo(pLeft.x, pLeft.y);
        ctx.lineTo(pRight.x, pRight.y);
        ctx.stroke();
      }

      // 4. Dual Perimeter Boundary Lines (Outer Emerald Glow + Inner Crisp White Core)
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = Math.max(4, Math.round(nw / 200));
      ctx.beginPath();
      ctx.moveTo(corners.tl.x, corners.tl.y);
      ctx.lineTo(corners.tr.x, corners.tr.y);
      ctx.lineTo(corners.br.x, corners.br.y);
      ctx.lineTo(corners.bl.x, corners.bl.y);
      ctx.closePath();
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1.5, Math.round(nw / 500));
      ctx.beginPath();
      ctx.moveTo(corners.tl.x, corners.tl.y);
      ctx.lineTo(corners.tr.x, corners.tr.y);
      ctx.lineTo(corners.br.x, corners.br.y);
      ctx.lineTo(corners.bl.x, corners.bl.y);
      ctx.closePath();
      ctx.stroke();

      // 5. Four Corner Target Pins (१, २, ३, ४) with Target Reticles
      const handles = [
        { key: 'tl', p: corners.tl, label: '१' },
        { key: 'tr', p: corners.tr, label: '२' },
        { key: 'br', p: corners.br, label: '३' },
        { key: 'bl', p: corners.bl, label: '४' },
      ];

      const pinRadius = Math.max(16, Math.round(nw / 50));
      handles.forEach(({ key, p, label }) => {
        const isActive = activeHandle === key;
        const currentRadius = isActive ? pinRadius * 1.25 : pinRadius;

        // Target Reticle Crosshair Lines
        ctx.strokeStyle = isActive ? '#f59e0b' : '#10b981';
        ctx.lineWidth = 2;
        const ch = currentRadius * 1.6;
        ctx.beginPath();
        ctx.moveTo(p.x - ch, p.y);
        ctx.lineTo(p.x + ch, p.y);
        ctx.moveTo(p.x, p.y - ch);
        ctx.lineTo(p.x, p.y + ch);
        ctx.stroke();

        // Dark Shadow Circle
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius + 3, 0, Math.PI * 2);
        ctx.fill();

        // Outer Emerald / Amber Active Ring
        ctx.fillStyle = isActive ? '#f59e0b' : '#10b981';
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        // Inner White Center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Pin Number Label
        ctx.fillStyle = isActive ? '#78350f' : '#064e3b';
        ctx.font = `black ${Math.round(currentRadius * 0.9)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, p.x, p.y);
      });

      // 6. PRECISION MAGNIFIER GLASS LOUPE (When dragging any corner pin)
      if (activeHandle && ['tl', 'tr', 'br', 'bl'].includes(activeHandle)) {
        const activeCorner = corners[activeHandle as keyof CornerPoints];
        const loupeRadius = Math.max(70, Math.round(nw / 10));
        const zoom = 2.5;

        // Position Loupe top-right or top-left depending on active corner location
        const isNearTopRight = activeCorner.x > nw * 0.55 && activeCorner.y < nh * 0.45;
        const loupeX = isNearTopRight ? loupeRadius + 25 : nw - loupeRadius - 25;
        const loupeY = loupeRadius + 25;

        ctx.save();
        // Circular clip for Loupe
        ctx.beginPath();
        ctx.arc(loupeX, loupeY, loupeRadius, 0, Math.PI * 2);
        ctx.clip();

        // Background fill for Loupe
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(loupeX - loupeRadius, loupeY - loupeRadius, loupeRadius * 2, loupeRadius * 2);

        // Draw zoomed image segment inside Loupe
        ctx.drawImage(
          img,
          activeCorner.x - loupeRadius / zoom,
          activeCorner.y - loupeRadius / zoom,
          (loupeRadius * 2) / zoom,
          (loupeRadius * 2) / zoom,
          loupeX - loupeRadius,
          loupeY - loupeRadius,
          loupeRadius * 2,
          loupeRadius * 2
        );

        // Precision Red Crosshairs inside Loupe
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(loupeX - 20, loupeY);
        ctx.lineTo(loupeX + 20, loupeY);
        ctx.moveTo(loupeX, loupeY - 20);
        ctx.lineTo(loupeX, loupeY + 20);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(loupeX, loupeY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Loupe Outer Glass Ring
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(loupeX, loupeY, loupeRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(loupeX, loupeY, loupeRadius - 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      // ================= STANDARD TRANSPARENT SELECTION MARQUEE CROP RENDER =================
      const { x, y, width, height } = cropRect;

      // 1. Subtle light transparent tint outside crop selection box (NO heavy black box!)
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
      ctx.fillRect(0, 0, nw, nh);

      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillRect(x, y, width, height);
      ctx.restore();

      // 2. Translucent glass highlight inside active crop selection area
      ctx.save();
      ctx.fillStyle = 'rgba(37, 99, 235, 0.06)';
      ctx.fillRect(x, y, width, height);
      ctx.restore();

      // 3. Rule of Thirds Grid (3x3) - Crisp translucent lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        // vertical
        ctx.beginPath();
        ctx.moveTo(x + (width * i) / 3, y);
        ctx.lineTo(x + (width * i) / 3, y + height);
        ctx.stroke();

        // horizontal
        ctx.beginPath();
        ctx.moveTo(x, y + (height * i) / 3);
        ctx.lineTo(x + width, y + (height * i) / 3);
        ctx.stroke();
      }

      // 4. Sharp Selection Marquee Boundary (Glowing Blue)
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = Math.max(2, Math.round(nw / 300));
      ctx.strokeRect(x, y, width, height);

      // 5. High-visibility Corner L-Brackets
      const cLen = Math.min(Math.max(14, Math.round(nw / 45)), Math.min(width, height) / 3);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(3, Math.round(nw / 200));

      // Top-Left Corner
      ctx.beginPath();
      ctx.moveTo(x, y + cLen);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cLen, y);
      ctx.stroke();

      // Top-Right Corner
      ctx.beginPath();
      ctx.moveTo(x + width - cLen, y);
      ctx.lineTo(x + width, y);
      ctx.lineTo(x + width, y + cLen);
      ctx.stroke();

      // Bottom-Right Corner
      ctx.beginPath();
      ctx.moveTo(x + width, y + height - cLen);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x + width - cLen, y + height);
      ctx.stroke();

      // Bottom-Left Corner
      ctx.beginPath();
      ctx.moveTo(x + cLen, y + height);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x, y + height - cLen);
      ctx.stroke();

      // 6. Prominent Blue/White Circle Handle Dots on 4 Corners + 4 Edge Midpoints for easy Lahan / Motha Resizing!
      const handleRadius = Math.max(10, Math.round(nw / 90));
      const handlePoints = [
        { x: x, y: y }, // nw
        { x: x + width, y: y }, // ne
        { x: x + width, y: y + height }, // se
        { x: x, y: y + height }, // sw
        { x: x + width / 2, y: y }, // n
        { x: x + width, y: y + height / 2 }, // e
        { x: x + width / 2, y: y + height }, // s
        { x: x, y: y + height / 2 }, // w
      ];

      handlePoints.forEach((hp) => {
        // Glowing Blue Base
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, handleRadius, 0, Math.PI * 2);
        ctx.fill();

        // Inner White Center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, handleRadius * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // Outer Dark Border Ring
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = Math.max(2, Math.round(handleRadius * 0.25));
        ctx.stroke();
      });
    }

    ctx.restore();
  }, [corners, cropRect, toolMode]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Pointer Down Interaction (Drag Selection Creation & Manipulation)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const pad = 40;

    const clickX = Math.round((e.clientX - rect.left) * scaleX - pad);
    const clickY = Math.round((e.clientY - rect.top) * scaleY - pad);

    const nw = img.naturalWidth || img.width;
    const nh = img.naturalHeight || img.height;

    const clampedX = Math.min(Math.max(0, clickX), nw);
    const clampedY = Math.min(Math.max(0, clickY), nh);

    if (toolMode === 'perspective') {
      const hitRadius = Math.max(30, Math.round(nw / 24));
      const cornerKeys: (keyof CornerPoints)[] = ['tl', 'tr', 'br', 'bl'];
      let found: string | null = null;

      for (const k of cornerKeys) {
        const pt = corners[k];
        const dist = Math.hypot(pt.x - clickX, pt.y - clickY);
        if (dist <= hitRadius) {
          found = k;
          break;
        }
      }

      if (found) {
        setActiveHandle(found);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
    } else {
      // Selection Mode (No handle points)
      const { x, y, width, height } = cropRect;
      
      // Calculate hit tolerance in canvas coordinate space considering canvas CSS scaling
      const cssScaleX = canvas.width / (rect.width || 1);
      const edgeHit = Math.max(36 * cssScaleX, Math.round(nw / 20));

      const isNearLeft = Math.abs(clampedX - x) <= edgeHit;
      const isNearRight = Math.abs(clampedX - (x + width)) <= edgeHit;
      const isNearTop = Math.abs(clampedY - y) <= edgeHit;
      const isNearBottom = Math.abs(clampedY - (y + height)) <= edgeHit;

      const isInsideX = clampedX >= x && clampedX <= x + width;
      const isInsideY = clampedY >= y && clampedY <= y + height;

      if (isNearTop && isNearLeft) {
        setActiveHandle('nw');
        setDragStart({ x: clampedX, y: clampedY, rect: { ...cropRect } });
      } else if (isNearTop && isNearRight) {
        setActiveHandle('ne');
        setDragStart({ x: clampedX, y: clampedY, rect: { ...cropRect } });
      } else if (isNearBottom && isNearRight) {
        setActiveHandle('se');
        setDragStart({ x: clampedX, y: clampedY, rect: { ...cropRect } });
      } else if (isNearBottom && isNearLeft) {
        setActiveHandle('sw');
        setDragStart({ x: clampedX, y: clampedY, rect: { ...cropRect } });
      } else if (isNearTop && isInsideX) {
        setActiveHandle('n');
        setDragStart({ x: clampedX, y: clampedY, rect: { ...cropRect } });
      } else if (isNearBottom && isInsideX) {
        setActiveHandle('s');
        setDragStart({ x: clampedX, y: clampedY, rect: { ...cropRect } });
      } else if (isNearLeft && isInsideY) {
        setActiveHandle('w');
        setDragStart({ x: clampedX, y: clampedY, rect: { ...cropRect } });
      } else if (isNearRight && isInsideY) {
        setActiveHandle('e');
        setDragStart({ x: clampedX, y: clampedY, rect: { ...cropRect } });
      } else if (isInsideX && isInsideY && width > 40 && height > 40) {
        // Move selection box
        setActiveHandle('move');
        setDragStart({ x: clampedX, y: clampedY, rect: { ...cropRect } });
      } else {
        // Click and drag anywhere to draw a NEW selection box immediately!
        setActiveHandle('select');
        setDragStart({ x: clampedX, y: clampedY, rect: { x: clampedX, y: clampedY, width: 0, height: 0 } });
      }

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  // Pointer Move Interaction
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeHandle) return;

    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const pad = 40;

    const nw = img.naturalWidth || img.width;
    const nh = img.naturalHeight || img.height;

    const canvasX = Math.min(Math.max(0, (e.clientX - rect.left) * scaleX - pad), nw);
    const canvasY = Math.min(Math.max(0, (e.clientY - rect.top) * scaleY - pad), nh);

    if (toolMode === 'perspective') {
      const cornerKey = activeHandle as keyof CornerPoints;
      setCorners((prev) => ({
        ...prev,
        [cornerKey]: { x: Math.round(canvasX), y: Math.round(canvasY) },
      }));
    } else if (dragStart) {
      if (activeHandle === 'select') {
        // Drag to draw new marquee selection rectangle
        const startX = dragStart.x;
        const startY = dragStart.y;

        const selX = Math.min(startX, canvasX);
        const selY = Math.min(startY, canvasY);
        const selW = Math.abs(canvasX - startX);
        const selH = Math.abs(canvasY - startY);

        if (selW > 5 || selH > 5) {
          setCropRect({
            x: Math.round(selX),
            y: Math.round(selY),
            width: Math.round(Math.max(20, selW)),
            height: Math.round(Math.max(20, selH)),
          });
        }
      } else {
        const orig = dragStart.rect;
        const dx = canvasX - dragStart.x;
        const dy = canvasY - dragStart.y;
        const minSize = 20;

        let nextX = orig.x;
        let nextY = orig.y;
        let nextW = orig.width;
        let nextH = orig.height;

        switch (activeHandle) {
          case 'move':
            nextX = Math.min(Math.max(0, orig.x + dx), nw - orig.width);
            nextY = Math.min(Math.max(0, orig.y + dy), nh - orig.height);
            break;
          case 'nw':
            nextX = Math.min(canvasX, orig.x + orig.width - minSize);
            nextY = Math.min(canvasY, orig.y + orig.height - minSize);
            nextW = orig.width + (orig.x - nextX);
            nextH = orig.height + (orig.y - nextY);
            break;
          case 'ne':
            nextY = Math.min(canvasY, orig.y + orig.height - minSize);
            nextW = Math.max(minSize, Math.min(canvasX - orig.x, nw - orig.x));
            nextH = orig.height + (orig.y - nextY);
            break;
          case 'se':
            nextW = Math.max(minSize, Math.min(canvasX - orig.x, nw - orig.x));
            nextH = Math.max(minSize, Math.min(canvasY - orig.y, nh - orig.y));
            break;
          case 'sw':
            nextX = Math.min(canvasX, orig.x + orig.width - minSize);
            nextW = orig.width + (orig.x - nextX);
            nextH = Math.max(minSize, Math.min(canvasY - orig.y, nh - orig.y));
            break;
          case 'n':
            nextY = Math.min(canvasY, orig.y + orig.height - minSize);
            nextH = orig.height + (orig.y - nextY);
            break;
          case 's':
            nextH = Math.max(minSize, Math.min(canvasY - orig.y, nh - orig.y));
            break;
          case 'w':
            nextX = Math.min(canvasX, orig.x + orig.width - minSize);
            nextW = orig.width + (orig.x - nextX);
            break;
          case 'e':
            nextW = Math.max(minSize, Math.min(canvasX - orig.x, nw - orig.x));
            break;
        }

        setCropRect({
          x: Math.round(Math.max(0, nextX)),
          y: Math.round(Math.max(0, nextY)),
          width: Math.round(Math.min(nextW, nw - nextX)),
          height: Math.round(Math.min(nextH, nh - nextY)),
        });
      }
    }
  };

  // Pointer Up Interaction
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeHandle) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
      setActiveHandle(null);
      setDragStart(null);
    }
  };

  // Mouse Wheel Scroll Zoom (Zoom In / Zoom Out crop box)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const img = imgRef.current;
    if (!img) return;
    const nw = img.naturalWidth || img.width;
    const nh = img.naturalHeight || img.height;

    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setCropRect((prev) => {
      const newW = Math.min(nw, Math.max(30, Math.round(prev.width * factor)));
      const newH = Math.min(nh, Math.max(30, Math.round(prev.height * factor)));
      const diffW = newW - prev.width;
      const diffH = newH - prev.height;
      const newX = Math.max(0, Math.min(nw - newW, Math.round(prev.x - diffW / 2)));
      const newY = Math.max(0, Math.min(nh - newH, Math.round(prev.y - diffH / 2)));
      return { x: newX, y: newY, width: newW, height: newH };
    });
  };

  // Button-based Scale Crop Box (1-Click Lahan / Motha Resizing)
  const handleScaleCrop = (scaleFactor: number) => {
    const img = imgRef.current;
    if (!img) return;
    const nw = img.naturalWidth || img.width;
    const nh = img.naturalHeight || img.height;

    setCropRect((prev) => {
      const newW = Math.min(nw, Math.max(30, Math.round(prev.width * scaleFactor)));
      const newH = Math.min(nh, Math.max(30, Math.round(prev.height * scaleFactor)));
      const diffW = newW - prev.width;
      const diffH = newH - prev.height;
      const newX = Math.max(0, Math.min(nw - newW, Math.round(prev.x - diffW / 2)));
      const newY = Math.max(0, Math.min(nh - newH, Math.round(prev.y - diffH / 2)));
      return { x: newX, y: newY, width: newW, height: newH };
    });
  };

  // Execute and Save Crop with 100% Guaranteed Original Quality
  const handleSaveCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const dims = getTargetDimensions();
    const filterOptions: FilterOptions = {
      mode: filterMode, // 'original' (default), 'magic', or 'bw'
      brightness: 100,
      contrast: 100,
      sharpenText: filterMode !== 'original',
    };

    let resultCanvas: HTMLCanvasElement;

    if (toolMode === 'perspective') {
      resultCanvas = warpPerspectiveCanvas(img, corners, dims.w, dims.h, filterOptions);
    } else {
      resultCanvas = cropRectCanvas(img, cropRect, dims.w, dims.h, filterOptions);
    }

    // Apply rotation if any
    if (rotationAngle !== 0) {
      const rotCanvas = document.createElement('canvas');
      const is90 = rotationAngle === 90 || rotationAngle === 270;
      rotCanvas.width = is90 ? resultCanvas.height : resultCanvas.width;
      rotCanvas.height = is90 ? resultCanvas.width : resultCanvas.height;

      const rCtx = rotCanvas.getContext('2d');
      if (rCtx) {
        rCtx.imageSmoothingEnabled = true;
        rCtx.imageSmoothingQuality = 'high';
        rCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
        rCtx.rotate((rotationAngle * Math.PI) / 180);
        rCtx.drawImage(resultCanvas, -resultCanvas.width / 2, -resultCanvas.height / 2);
        onCropSave(rotCanvas.toDataURL('image/jpeg', 0.99));
        onClose();
        return;
      }
    }

    onCropSave(resultCanvas.toDataURL('image/jpeg', 0.99));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden">
        
        {/* HEADER TOOLBAR WITH CLEAN MODE SWITCHER */}
        <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-black text-amber-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>{cardLabel}</span>
            </span>

            {/* CROP MODE SWITCHER TABS */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setToolMode('perspective')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  toolMode === 'perspective'
                    ? 'bg-emerald-600 text-white shadow-sm font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-amber-300" />
                <span>🎯 ४-कोने सरळ करा (Perspective)</span>
              </button>

              <button
                type="button"
                onClick={() => setToolMode('standard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  toolMode === 'standard'
                    ? 'bg-blue-600 text-white shadow-sm font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Crop className="w-3.5 h-3.5 text-blue-200" />
                <span>📐 स्टँडर्ड क्रॉप (Photoshop Crop)</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
            title="बंद करा"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUBHEADER: PRESETS & ESSENTIAL TOOLS */}
        <div className="bg-slate-100 dark:bg-slate-950 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          {/* Quick Document Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-500 dark:text-slate-400">साईज:</span>
            <button
              type="button"
              onClick={() => applyPreset('card')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer font-bold transition-all ${
                docPreset === 'card'
                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>PVC कार्ड</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('a4')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer font-bold transition-all ${
                docPreset === 'a4'
                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>A4 डॉक्युमेंट</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('free')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer font-bold transition-all ${
                docPreset === 'free'
                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>फ्री साईज (Free)</span>
            </button>
          </div>

          {/* Quick Zoom, Rotate & Auto-Fit Tools */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* EASY 1-CLICK LAHAN / MOTHA BUTTONS */}
            <div className="flex items-center gap-1 bg-blue-50 dark:bg-slate-800 p-1 rounded-xl border border-blue-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => handleScaleCrop(0.85)}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 transition-all"
                title="निवडलेली जागा लहान करा"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>🔍 लहान करा</span>
              </button>
              <button
                type="button"
                onClick={() => handleScaleCrop(1.18)}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 transition-all"
                title="निवडलेली जागा मोठी करा"
              >
                <ZoomOut className="w-3.5 h-3.5" />
                <span>🔍 मोठे करा</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleAutoFit}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              title="डॉक्युमेंटच्या कडा आपोआप सेट करा"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>🤖 ऑटो फिट</span>
            </button>

            <button
              type="button"
              onClick={() => setRotationAngle((prev) => (prev + 90) % 360)}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="फोटो ९०° ने फिरवा"
            >
              <RotateCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>फिरवा ({rotationAngle}°)</span>
            </button>
          </div>
        </div>

        {/* INTERACTIVE CROP CANVAS */}
        <div className="flex-1 bg-slate-950 overflow-auto p-4 flex items-center justify-center relative min-h-[340px]">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            className="max-w-full max-h-[62vh] object-contain rounded-lg shadow-2xl cursor-crosshair touch-none select-none border border-slate-800"
          />
        </div>

        {/* FOOTER: CLEAN SINGLE PRIMARY ACTION BUTTON */}
        <div className="bg-slate-900 p-3.5 border-t border-slate-800 flex items-center justify-center shrink-0">
          <button
            type="button"
            onClick={handleSaveCrop}
            className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2.5 cursor-pointer shadow-xl active:scale-95 transition-all border border-emerald-500"
          >
            <CheckCircle2 className="w-5 h-5 text-amber-300" />
            <span>✅ क्रॉप करा व प्रिंटसाठी ठेवा (Apply Crop)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
