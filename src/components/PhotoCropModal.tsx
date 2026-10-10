import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Crop } from 'lucide-react';

interface PhotoCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedDataUrl: string) => void;
}

export const PhotoCropModal: React.FC<PhotoCropModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      setZoom(1);
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

    // Passport aspect ratio 3:4 (High-Resolution 600 x 800 for crisp PVC print)
    const targetW = 600;
    const targetH = 800;
    canvas.width = targetW;
    canvas.height = targetH;

    // Background fill (crisp white for photo backing)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Save state
    ctx.save();

    // Move to center of canvas + offset
    ctx.translate(targetW / 2 + offset.x, targetH / 2 + offset.y);

    // Rotate
    ctx.rotate((rotation * Math.PI) / 180);

    // Scale
    ctx.scale(zoom, zoom);

    // Calculate dimensions to fit nicely in 3:4 frame without over-zoom
    const imgAspect = img.width / img.height;
    const frameAspect = targetW / targetH; // 0.75
    let renderW = targetW;
    let renderH = targetH;

    // Natural fit: cover the frame edge-to-edge without excessive zoom
    if (imgAspect > frameAspect) {
      renderH = targetH;
      renderW = targetH * imgAspect;
    } else {
      renderW = targetW;
      renderH = targetW / imgAspect;
    }

    // Draw centered
    ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);

    // Restore state
    ctx.restore();
  }, [offset, rotation, zoom]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // Center face handler
  const handleCenterFace = () => {
    setOffset({ x: 0, y: 0 });
  };

  // Reset all adjustments
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Mouse & Touch Pan Handlers (Scaled to canvas coordinate space)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStart.x) * (600 / 210);
    const dy = (e.clientY - dragStart.y) * (800 / 280);
    setOffset((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = (e.touches[0].clientX - dragStart.x) * (600 / 210);
    const dy = (e.touches[0].clientY - dragStart.y) * (800 / 280);
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
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.98);
    onCropComplete(croppedDataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-[#094d28] text-white px-5 py-3.5 flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-yellow-300" />
            <h3 className="font-extrabold text-base">फोटो क्रॉप व चेहरा सेंटर करा (Crop Photo)</h3>
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

        {/* Content */}
        <div className="p-4 sm:p-5 flex flex-col items-center gap-3.5 bg-slate-50 dark:bg-slate-950/60">
          <p className="text-xs text-gray-700 dark:text-slate-300 text-center font-medium">
            फोटो ड्रॅग करून चेहरा मध्यभागी (Center) आणा आणि झूम कंट्रोलने योग्य आकार द्या.
          </p>

          {/* Interactive Crop Canvas with Passport 3:4 Frame & Face Oval Guide */}
          <div
            className="relative w-[210px] h-[280px] bg-gray-200 dark:bg-slate-800 rounded-2xl overflow-hidden border-2 border-emerald-600 shadow-lg cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full object-cover pointer-events-none"
            />

            {/* Passport Face Position Guide Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Head / Face Oval Guide */}
              <div 
                className="w-[120px] h-[155px] rounded-[50%] border border-dashed border-emerald-500/70 dark:border-emerald-400/80 -mt-5" 
                style={{ boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.12)' }}
              />
              {/* Center Crosshair Marker */}
              <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none">
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-emerald-500/60" />
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-emerald-500/60" />
              </div>
            </div>

            {/* Guide Grid overlay */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/30">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div />
            </div>

            {/* Hint Badge */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/60 backdrop-blur-xs rounded-full text-[10px] text-white/90 font-medium pointer-events-none">
              ३:४ पासपोर्ट आकार
            </div>
          </div>

          {/* Controls Bar */}
          <div className="w-full bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-3">
            {/* Quick Alignment Action Buttons */}
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleCenterFace}
                className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs text-center"
                title="चेहरा मध्यभागी आणा"
              >
                🎯 चेहरा सेंटर (Center Face)
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-transparent dark:border-slate-700"
                title="मूळ आकार रिसेट करा"
              >
                रीसेट
              </button>
            </div>

            {/* Zoom Slider */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.4, parseFloat((z - 0.08).toFixed(2))))}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-600 dark:text-slate-400 cursor-pointer"
                title="झूम कमी करा"
              >
                <ZoomOut className="w-4 h-4 shrink-0" />
              </button>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 h-1.5 bg-gray-200 dark:bg-slate-800 rounded-lg cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.5, parseFloat((z + 0.08).toFixed(2))))}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-600 dark:text-slate-400 cursor-pointer"
                title="झूम वाढवा"
              >
                <ZoomIn className="w-4 h-4 shrink-0" />
              </button>
              <span className="text-[11px] font-mono font-bold text-gray-600 dark:text-slate-300 w-10 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Rotate & Nudge Buttons */}
            <div className="flex items-center justify-between pt-1 gap-2">
              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-transparent dark:border-slate-700"
                title="फोटो ९० अंश फिरवा"
              >
                <RotateCw className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>90° फिरवा</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setOffset((prev) => ({ ...prev, y: prev.y - 35 }))}
                  className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="फोटो वर सरकवा"
                >
                  ↑ वर
                </button>
                <button
                  type="button"
                  onClick={() => setOffset((prev) => ({ ...prev, y: prev.y + 35 }))}
                  className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="फोटो खाली सरकवा"
                >
                  ↓ खाली
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-transparent dark:border-slate-700"
          >
            रद्द करा (Cancel)
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#094d28] hover:bg-[#073d1f] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 text-yellow-300" />
            <span>क्रॉप सेव्ह करा (Save Photo)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
