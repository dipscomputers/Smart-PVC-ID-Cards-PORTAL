import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Check, Crop, RotateCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RefreshCw, Sun, Sliders } from 'lucide-react';

interface PhotoCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedDataUrl: string) => void;
}

type AspectRatioMode = 'photo' | 'signature' | 'square';

export const PhotoCropModal: React.FC<PhotoCropModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
}) => {
  const [aspectMode, setAspectMode] = useState<AspectRatioMode>('photo');
  const [zoom, setZoom] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Target dimensions based on selected aspect mode
  const getTargetDimensions = useCallback(() => {
    if (aspectMode === 'signature') return { targetW: 512, targetH: 128, label: '२५६×६४ स्वाक्षरी' };
    if (aspectMode === 'square') return { targetW: 400, targetH: 400, label: '१:१ चौरस' };
    return { targetW: 480, targetH: 606, label: '१६०×२०२ फोटो' };
  }, [aspectMode]);

  // Load image into canvas
  useEffect(() => {
    if (!imageSrc || !isOpen) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      setZoom(1.0);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      drawPreview();
    };
  }, [imageSrc, isOpen]);

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { targetW, targetH } = getTargetDimensions();
    canvas.width = targetW;
    canvas.height = targetH;

    // Background fill
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.save();

    // Move to center + offset
    ctx.translate(targetW / 2 + offset.x, targetH / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    const imgAspect = img.width / img.height;
    const frameAspect = targetW / targetH;
    let renderW = targetW;
    let renderH = targetH;

    if (imgAspect > frameAspect) {
      renderH = targetH;
      renderW = targetH * imgAspect;
    } else {
      renderW = targetW;
      renderH = targetW / imgAspect;
    }

    ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);
    ctx.restore();
  }, [offset, rotation, zoom, getTargetDimensions]);

  useEffect(() => {
    if (isOpen) {
      drawPreview();
    }
  }, [drawPreview, isOpen, aspectMode]);

  // Directional Shifting
  const handleShiftUp = () => setOffset((prev) => ({ ...prev, y: prev.y - 25 }));
  const handleShiftDown = () => setOffset((prev) => ({ ...prev, y: prev.y + 25 }));
  const handleShiftLeft = () => setOffset((prev) => ({ ...prev, x: prev.x - 25 }));
  const handleShiftRight = () => setOffset((prev) => ({ ...prev, x: prev.x + 25 }));

  // Reset all adjustments
  const handleReset = () => {
    setZoom(1.0);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Mouse & Touch Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const { targetW } = getTargetDimensions();
    const scaleFactor = (targetW / 240) / Math.max(0.5, zoom);
    const dx = (e.clientX - dragStart.x) * scaleFactor;
    const dy = (e.clientY - dragStart.y) * scaleFactor;
    setOffset((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const { targetW } = getTargetDimensions();
    const scaleFactor = (targetW / 240) / Math.max(0.5, zoom);
    const dx = (e.touches[0].clientX - dragStart.x) * scaleFactor;
    const dy = (e.touches[0].clientY - dragStart.y) * scaleFactor;
    setOffset((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Handle Save
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    onCropComplete(croppedDataUrl);
    onClose();
  };

  if (!isOpen) return null;

  const { label: aspectLabel } = getTargetDimensions();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-800 animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-amber-300" />
            <h3 className="font-extrabold text-sm sm:text-base">फोटो / सही क्रॉप करा (Crop Photo / Signature)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer text-white"
            title="बंद करा"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex flex-col items-center gap-4 bg-slate-50 dark:bg-slate-950/60">
          
          {/* Aspect Ratio Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-full justify-center shadow-xs">
            <button
              type="button"
              onClick={() => { setAspectMode('photo'); handleReset(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                aspectMode === 'photo'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
              }`}
            >
              <span>📷 फोटो (160×202)</span>
            </button>
            <button
              type="button"
              onClick={() => { setAspectMode('signature'); handleReset(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                aspectMode === 'signature'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
              }`}
            >
              <span>✍️ सही (256×64)</span>
            </button>
            <button
              type="button"
              onClick={() => { setAspectMode('square'); handleReset(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                aspectMode === 'square'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
              }`}
            >
              <span>📐 चौरस (1:1)</span>
            </button>
          </div>

          {/* Crop Canvas Box */}
          <div
            className={`relative bg-white rounded-2xl overflow-hidden border-2 border-blue-600 shadow-lg cursor-grab active:cursor-grabbing select-none flex items-center justify-center transition-all ${
              aspectMode === 'signature' ? 'w-[280px] h-[70px]' : aspectMode === 'square' ? 'w-[220px] h-[220px]' : 'w-[190px] h-[240px]'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={(e) => {
              const delta = e.deltaY < 0 ? 0.08 : -0.08;
              setZoom((z) => Math.min(3.0, Math.max(0.3, parseFloat((z + delta).toFixed(2)))));
            }}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full object-cover pointer-events-none"
            />
            {/* Guide Label */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-black/80 backdrop-blur-xs rounded-md text-[10px] text-white font-black shadow-sm pointer-events-none">
              {aspectLabel}
            </div>
          </div>

          {/* Controls Box */}
          <div className="w-full bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-3 shadow-xs">
            
            {/* Directional Pad Buttons */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 mb-0.5">फोटो माऊस किंवा बटनाने सरकवा (Drag / Shift):</span>
              <div className="flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={handleShiftLeft}
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                  title="डावीकडे"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={handleShiftUp}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                    title="फोटो वर घ्या"
                  >
                    <ArrowUp className="w-4 h-4" />
                    <span>वर घ्या</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShiftDown}
                    className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                    title="खाली घ्या"
                  >
                    <ArrowDown className="w-4 h-4" />
                    <span>खाली</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleShiftRight}
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                  title="उजवीकडे"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Zoom Bar */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.4, parseFloat((z - 0.08).toFixed(2))))}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-gray-700 dark:text-slate-300 cursor-pointer active:scale-95 transition-transform"
                title="झूम लहान करा"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-gray-200 dark:bg-slate-800 rounded-lg cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.5, parseFloat((z + 0.08).toFixed(2))))}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-gray-700 dark:text-slate-300 cursor-pointer active:scale-95 transition-transform"
                title="झूम मोठे करा"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Rotate & Reset */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                <RotateCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>फिरवा (90°)</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5 text-gray-600 dark:text-slate-400" />
                <span>रीसेट</span>
              </button>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            रद्द करा
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4 text-emerald-200" />
            <span>क्रॉप सेव्ह करा (Apply Crop)</span>
          </button>
        </div>

      </div>
    </div>
  );
};

