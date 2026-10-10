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
  initialMode = 'perspective'
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
  const [loupeInfo, setLoupeInfo] = useState<{ x: number; y: number; px: number; py: number } | null>(null);

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
      // 1. Dark mask outside quadrilateral
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
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
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
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

      // 4. Perimeter neon boundary
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = Math.max(3, Math.round(nw / 240));
      ctx.beginPath();
      ctx.moveTo(corners.tl.x, corners.tl.y);
      ctx.lineTo(corners.tr.x, corners.tr.y);
      ctx.lineTo(corners.br.x, corners.br.y);
      ctx.lineTo(corners.bl.x, corners.bl.y);
      ctx.closePath();
      ctx.stroke();

      // 5. Four Corner Pins (१, २, ३, ४)
      const handles = [
        { key: 'tl', p: corners.tl, label: '१' },
        { key: 'tr', p: corners.tr, label: '२' },
        { key: 'br', p: corners.br, label: '३' },
        { key: 'bl', p: corners.bl, label: '४' },
      ];

      const pinRadius = Math.max(14, Math.round(nw / 55));
      handles.forEach(({ p, label }) => {
        // Outer halo
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(p.x, p.y, pinRadius, 0, Math.PI * 2);
        ctx.fill();

        // Inner circle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, pinRadius * 0.72, 0, Math.PI * 2);
        ctx.fill();

        // Pin number
        ctx.fillStyle = '#065f46';
        ctx.font = `bold ${Math.round(pinRadius * 0.9)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, p.x, p.y);
      });
    } else {
      // ================= STANDARD PHOTOSHOP CROP RENDER =================
      const { x, y, width, height } = cropRect;

      // 1. Dark mask outside crop box
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fillRect(0, 0, nw, nh);

      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillRect(x, y, width, height);
      ctx.restore();

      // 2. Rule of Thirds Grid (3x3)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.5;
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

      // 3. Crisp Blue Crop Boundary
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = Math.max(2.5, Math.round(nw / 260));
      ctx.strokeRect(x, y, width, height);

      // 4. 8 Photoshop Handles (NW, N, NE, E, SE, S, SW, W)
      const hSize = Math.max(12, Math.round(nw / 65));
      const handlePoints = [
        { id: 'nw', px: x, py: y },
        { id: 'n', px: x + width / 2, py: y },
        { id: 'ne', px: x + width, py: y },
        { id: 'e', px: x + width, py: y + height / 2 },
        { id: 'se', px: x + width, py: y + height },
        { id: 's', px: x + width / 2, py: y + height },
        { id: 'sw', px: x, py: y + height },
        { id: 'w', px: x, py: y + height / 2 },
      ];

      handlePoints.forEach(({ px, py }) => {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#1d4ed8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.rect(px - hSize / 2, py - hSize / 2, hSize, hSize);
        ctx.fill();
        ctx.stroke();
      });
    }

    ctx.restore();
  }, [corners, cropRect, toolMode]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Pointer Down Interaction
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const pad = 40;

    const clickX = (e.clientX - rect.left) * scaleX - pad;
    const clickY = (e.clientY - rect.top) * scaleY - pad;

    const nw = img.naturalWidth || img.width;

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
        setLoupeInfo({ x: e.clientX, y: e.clientY, px: clickX, py: clickY });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
    } else {
      // Standard 8 handles hit test
      const { x, y, width, height } = cropRect;
      const hHit = Math.max(24, Math.round(nw / 28));

      const handles = [
        { id: 'nw', px: x, py: y },
        { id: 'n', px: x + width / 2, py: y },
        { id: 'ne', px: x + width, py: y },
        { id: 'e', px: x + width, py: y + height / 2 },
        { id: 'se', px: x + width, py: y + height },
        { id: 's', px: x + width / 2, py: y + height },
        { id: 'sw', px: x, py: y + height },
        { id: 'w', px: x, py: y + height / 2 },
      ];

      let foundHandle: string | null = null;
      for (const h of handles) {
        if (Math.hypot(h.px - clickX, h.py - clickY) <= hHit) {
          foundHandle = h.id;
          break;
        }
      }

      if (foundHandle) {
        setActiveHandle(foundHandle);
        setDragStart({ x: clickX, y: clickY, rect: { ...cropRect } });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } else if (clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height) {
        // Move entire box
        setActiveHandle('move');
        setDragStart({ x: clickX, y: clickY, rect: { ...cropRect } });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
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
      setLoupeInfo({ x: e.clientX, y: e.clientY, px: canvasX, py: canvasY });
    } else if (dragStart) {
      const orig = dragStart.rect;
      const dx = canvasX - dragStart.x;
      const dy = canvasY - dragStart.y;
      const minSize = 40;

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

      setLoupeInfo({ x: e.clientX, y: e.clientY, px: canvasX, py: canvasY });
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
      setLoupeInfo(null);
    }
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
        
        {/* HEADER TOOLBAR WITH PHOTOSHOP CROP & PERSPECTIVE CROP TABS */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-amber-400 flex items-center gap-1.5">
              <Crop className="w-4.5 h-4.5" />
              <span>{cardLabel}</span>
            </span>

            {/* PHOTOSHOP CROP MODE SWITCHER */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setToolMode('perspective')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                  toolMode === 'perspective'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-amber-300" />
                <span>🎯 पर्स्पेक्टिव्ह क्रॉप (४-कोने सरळ करा)</span>
              </button>

              <button
                type="button"
                onClick={() => setToolMode('standard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                  toolMode === 'standard'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Crop className="w-3.5 h-3.5" />
                <span>📐 स्टँडर्ड क्रॉप (Photoshop Crop)</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUBHEADER: PRESETS, ROTATE & AUTO-FIT */}
        <div className="bg-slate-100 dark:bg-slate-950 px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          {/* Quick Document Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-600 dark:text-slate-400">साईज रेशिओ:</span>
            <button
              type="button"
              onClick={() => applyPreset('card')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer font-bold transition-all ${
                docPreset === 'card'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>PVC कार्ड (Aadhaar / PAN)</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('a4')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer font-bold transition-all ${
                docPreset === 'a4'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>A4 डॉक्युमेंट</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('passport')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer font-bold transition-all ${
                docPreset === 'passport'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>पासपोर्ट फोटो</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('free')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer font-bold transition-all ${
                docPreset === 'free'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>फ्री साईज (Free)</span>
            </button>
          </div>

          {/* Quick Rotate & Auto-Fit Tools */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleAutoFit}
              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer shadow-xs"
              title="डॉक्युमेंटच्या कडा आपोआप सेट करा"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>🤖 ऑटो फिट</span>
            </button>

            <button
              type="button"
              onClick={() => setRotationAngle((prev) => (prev + 90) % 360)}
              className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>फिरवा ({rotationAngle}°)</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>रीसेट</span>
            </button>
          </div>
        </div>

        {/* INTERACTIVE CROP CANVAS */}
        <div className="flex-1 bg-slate-950 overflow-auto p-3 flex items-center justify-center relative min-h-[320px]">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl cursor-crosshair touch-none select-none border border-slate-800"
          />

          {/* Real-time Magnifier Glass Loupe */}
          {loupeInfo && (
            <div
              className="pointer-events-none fixed z-50 w-28 h-28 rounded-full border-4 border-amber-400 bg-slate-950 shadow-2xl overflow-hidden flex items-center justify-center"
              style={{
                left: `${loupeInfo.x - 56}px`,
                top: `${loupeInfo.y - 120}px`,
              }}
            >
              <div className="text-center text-white text-[11px] font-mono">
                <ZoomIn className="w-5 h-5 mx-auto text-amber-400 mb-0.5" />
                <span className="font-bold">X: {Math.round(loupeInfo.px)}</span>
                <br />
                <span className="font-bold">Y: {Math.round(loupeInfo.py)}</span>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER: PRINT QUALITY FILTER & CONFIRM BUTTON */}
        <div className="bg-slate-50 dark:bg-slate-900 p-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Quality Mode Selection */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>प्रिंट क्वालिटी:</span>
            </span>

            {/* DEFAULT & RECOMMENDED: ORIGINAL HD QUALITY */}
            <button
              type="button"
              onClick={() => setFilterMode('original')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold cursor-pointer transition-all ${
                filterMode === 'original'
                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>🌟 मूळ क्वालिटी (Original HD - Best & Clear)</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('magic')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold cursor-pointer transition-all ${
                filterMode === 'magic'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
              <span>✨ बॅकग्राउंड व्हाईट (Auto White)</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('bw')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold cursor-pointer transition-all ${
                filterMode === 'bw'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>📄 B&W डॉक्युमेंट</span>
            </button>
          </div>

          {/* Confirm Crop Button */}
          <button
            type="button"
            onClick={handleSaveCrop}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-5 h-5 text-amber-300" />
            <span>✅ क्रॉप करा व प्रिंटसाठी ठेवा (Apply Crop)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
