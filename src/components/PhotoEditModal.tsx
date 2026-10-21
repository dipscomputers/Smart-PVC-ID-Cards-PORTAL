import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  ZoomIn, 
  Check, 
  Crop, 
  RotateCw, 
  RefreshCw, 
  Sun, 
  Contrast, 
  Wand2,
  SlidersHorizontal,
  Palette,
  User,
  FileSignature,
  Square
} from 'lucide-react';

interface PhotoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onEditComplete: (editedDataUrl: string) => void;
  initialTab?: 'crop' | 'adjust';
}

type AspectRatioMode = 'photo' | 'signature' | 'square';

export const PhotoEditModal: React.FC<PhotoEditModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onEditComplete,
  initialTab = 'crop',
}) => {
  const [activeTab, setActiveTab] = useState<'crop' | 'adjust'>(initialTab);

  // Crop State
  const [aspectMode, setAspectMode] = useState<AspectRatioMode>('photo');
  const [zoom, setZoom] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Adjustment State
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturate, setSaturate] = useState<number>(100);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Target dimensions based on selected aspect mode
  const getTargetDimensions = useCallback(() => {
    if (aspectMode === 'signature') return { targetW: 512, targetH: 128, label: '256×64 स्वाक्षरी' };
    if (aspectMode === 'square') return { targetW: 400, targetH: 400, label: '1:1 चौरस' };
    return { targetW: 480, targetH: 606, label: '160×202 फोटो' };
  }, [aspectMode]);

  // Load image
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
      setBrightness(100);
      setContrast(100);
      setSaturate(100);
      drawPreview();
    };
  }, [imageSrc, isOpen]);

  // Draw preview combining both Crop and Adjustments onto Canvas
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

    // Apply Filter Styles (Brightness, Contrast, Saturation)
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`;

    ctx.save();

    // Move to center + offset for cropping/zooming
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
    ctx.filter = 'none';
  }, [offset, rotation, zoom, brightness, contrast, saturate, getTargetDimensions]);

  useEffect(() => {
    if (isOpen) {
      drawPreview();
    }
  }, [drawPreview, isOpen, aspectMode]);

  // Reset Adjustments
  const handleReset = () => {
    setZoom(1.0);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    setBrightness(100);
    setContrast(100);
    setSaturate(100);
  };

  // Mouse & Touch Dragging for Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Finalize Crop & Edit
  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    onEditComplete(croppedDataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-[#000000_!important] inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                फोटो एडिट व क्रॉप टूल
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                शासकीय फॉर्मसाठी फोटो क्रॉप, झूम आणि ब्राइटनेस ॲडजस्ट करा
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION TABS: CROP VS ADJUSTMENTS */}
        <div className="px-5 pt-3 pb-2 bg-slate-100 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2">
          <button
            onClick={() => setActiveTab('crop')}
            className={`flex-1 max-w-[200px] py-2 px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'crop'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Crop className="w-4 h-4" />
            <span>✂️ फोटो क्रॉप (Crop)</span>
          </button>

          <button
            onClick={() => setActiveTab('adjust')}
            className={`flex-1 max-w-[200px] py-2 px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'adjust'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>🎨 फोटो एडिट (Edit)</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col items-center gap-4">
          
          {/* CANVAS PREVIEW AREA */}
          <div className="relative flex flex-col items-center justify-center bg-slate-950/90 dark:bg-slate-950 p-4 rounded-2xl w-full border border-slate-800 shadow-inner overflow-hidden min-h-[260px]">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="max-h-[240px] sm:max-h-[280px] w-auto rounded-lg shadow-xl border-2 border-dashed border-indigo-500/50 cursor-grab active:cursor-grabbing transition-shadow"
            />
            <p className="text-[11px] text-slate-400 mt-2 font-semibold flex items-center gap-1.5">
              💡 फोटो माउसने ड्रग (Drag) करून पोझिशन सेट करा
            </p>
          </div>

          {/* TAB 1: CROP CONTROLS */}
          {activeTab === 'crop' && (
            <div className="w-full flex flex-col gap-4">
              
              {/* BEAUTIFUL DESIGNED ASPECT RATIO PRESETS */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    क्रॉप साईझ निवडा (Aspect Ratio):
                  </label>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/50">
                    {aspectMode === 'photo' ? 'फोटो (160×202)' : aspectMode === 'signature' ? 'स्वाक्षरी (256×64)' : 'चौरस (1:1)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Photo 160x202 Option */}
                  <button
                    type="button"
                    onClick={() => setAspectMode('photo')}
                    className={`relative p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-3 ${
                      aspectMode === 'photo'
                        ? 'bg-gradient-to-br from-indigo-50 to-indigo-100/60 dark:from-indigo-950/70 dark:to-slate-900 border-indigo-600 dark:border-indigo-500 shadow-sm ring-2 ring-indigo-600/20'
                        : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      aspectMode === 'photo' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      <User className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800 dark:text-white">फोटो</span>
                        {aspectMode === 'photo' && (
                          <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        160 × 202 px
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        शासकीय फॉर्म फोटो
                      </div>
                    </div>
                  </button>

                  {/* Signature 256x64 Option */}
                  <button
                    type="button"
                    onClick={() => setAspectMode('signature')}
                    className={`relative p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-3 ${
                      aspectMode === 'signature'
                        ? 'bg-gradient-to-br from-indigo-50 to-indigo-100/60 dark:from-indigo-950/70 dark:to-slate-900 border-indigo-600 dark:border-indigo-500 shadow-sm ring-2 ring-indigo-600/20'
                        : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      aspectMode === 'signature' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      <FileSignature className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800 dark:text-white">स्वाक्षरी</span>
                        {aspectMode === 'signature' && (
                          <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        256 × 64 px
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        फॉर्म सही (Sign)
                      </div>
                    </div>
                  </button>

                  {/* Square 1:1 Option */}
                  <button
                    type="button"
                    onClick={() => setAspectMode('square')}
                    className={`relative p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-3 ${
                      aspectMode === 'square'
                        ? 'bg-gradient-to-br from-indigo-50 to-indigo-100/60 dark:from-indigo-950/70 dark:to-slate-900 border-indigo-600 dark:border-indigo-500 shadow-sm ring-2 ring-indigo-600/20'
                        : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      aspectMode === 'square' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      <Square className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800 dark:text-white">चौरस</span>
                        {aspectMode === 'square' && (
                          <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        1:1 चौरस
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        इतर कागदपत्रे
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* ZOOM & ROTATE CONTROLS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                {/* Zoom Slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <ZoomIn className="w-4 h-4 text-indigo-500" />
                      झूम (Zoom):
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md text-[11px]">
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  />
                </div>

                {/* Rotate Control */}
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <RotateCw className="w-4 h-4 text-indigo-500" />
                    फिरवा (Rotate):
                  </span>
                  <button
                    type="button"
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    className="px-3.5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{rotation}°</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: EDITING & ADJUSTMENTS */}
          {activeTab === 'adjust' && (
            <div className="w-full flex flex-col gap-4">
              
              {/* SLIDERS FOR BRIGHTNESS, CONTRAST, SATURATE */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
                {/* Brightness */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sun className="w-4 h-4 text-amber-500" />
                      ब्राइटनेस (Brightness):
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-extrabold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md text-[11px]">
                      {brightness}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="160"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  />
                </div>

                {/* Contrast */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Contrast className="w-4 h-4 text-indigo-500" />
                      कॉन्ट्रास्ट (Contrast):
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md text-[11px]">
                      {contrast}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="180"
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  />
                </div>

                {/* Saturation */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-purple-500" />
                      रंग तीव्रता (Saturation):
                    </span>
                    <span className="text-purple-600 dark:text-purple-400 font-extrabold bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md text-[11px]">
                      {saturate}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturate}
                    onChange={(e) => setSaturate(parseInt(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  />
                </div>
              </div>

            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>रीसेट (Reset All)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
            >
              रद्द करा (Cancel)
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>लागू करा (Apply)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
