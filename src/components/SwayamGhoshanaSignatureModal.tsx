import React, { useRef, useState, useEffect } from 'react';
import { X, Check, RotateCcw, PenTool } from 'lucide-react';

interface SwayamGhoshanaSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
  existingSignature?: string;
}

export const SwayamGhoshanaSignatureModal: React.FC<SwayamGhoshanaSignatureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState<'#000000' | '#002b80' | '#1e3a8a'>('#000000');
  const [penSize, setPenSize] = useState<number>(3.6);

  // Initialize Canvas
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set internal resolution for crisp high-DPI display
    canvas.width = 600;
    canvas.height = 240;

    // Clear canvas (keep transparent background, no white fill)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (existingSignature) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = existingSignature;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasDrawn(true);
      };
    } else {
      setHasDrawn(false);
    }
  }, [isOpen, existingSignature]);

  // Update pen styles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
  }, [penColor, penSize]);

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!hasDrawn) {
      onSave('');
      onClose();
      return;
    }

    // Convert canvas to transparent PNG or white background PNG
    // Create a trimmed transparent signature or standard high-res signature
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-lg">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                डिजिटल स्वाक्षरी पॅड (Digital Signature)
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                स्क्रीनवर बोटाने किंवा माऊसने सही करा
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="p-6 space-y-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white shadow-inner relative">
            <canvas
              ref={canvasRef}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              style={{ touchAction: 'none' }}
              className="w-full h-48 block cursor-crosshair"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-300 select-none">
                <span className="text-sm font-semibold">येथे सही करा (Sign Here)</span>
              </div>
            )}
          </div>

          {/* Controls: Color & Size */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-600 dark:text-slate-400">पेनचा रंग:</span>
              <button
                type="button"
                onClick={() => setPenColor('#000000')}
                className={`w-6 h-6 rounded-full bg-black border-2 transition-all cursor-pointer ${
                  penColor === '#000000' ? 'ring-2 ring-blue-500 ring-offset-1 border-white' : 'border-transparent'
                }`}
                title="काळा"
              />
              <button
                type="button"
                onClick={() => setPenColor('#002b80')}
                className={`w-6 h-6 rounded-full bg-[#002b80] border-2 transition-all cursor-pointer ${
                  penColor === '#002b80' ? 'ring-2 ring-blue-500 ring-offset-1 border-white' : 'border-transparent'
                }`}
                title="गडद निळा"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-600 dark:text-slate-400">पेन जाडी:</span>
              <button
                type="button"
                onClick={() => setPenSize(2.2)}
                className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer ${
                  penSize === 2.2 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                }`}
              >
                बारीक
              </button>
              <button
                type="button"
                onClick={() => setPenSize(3.6)}
                className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer ${
                  penSize === 3.6 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                }`}
              >
                मध्यम
              </button>
              <button
                type="button"
                onClick={() => setPenSize(5.0)}
                className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer ${
                  penSize === 5.0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                }`}
              >
                मोठी / जाड
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>साफ करा (Clear)</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              रद्द करा
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>स्वाक्षरी जोडा (Save)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
