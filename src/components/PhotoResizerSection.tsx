import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  RotateCw, 
  CheckCircle2, 
  Sliders, 
  FlipHorizontal,
  FlipVertical,
  Lock,
  Unlock,
  ImageIcon,
  Sparkles,
  Maximize2,
  Crop,
  Sun,
  Contrast,
  RefreshCw,
  Wand2,
  Trash2,
  FileText,
  Eye
} from 'lucide-react';
import { useRegisterShortcuts } from '../context/ShortcutsContext';
import { PhotoCropModal } from './PhotoCropModal';
import { PhotoEditModal } from './PhotoEditModal';
import { PdfResizerSection } from './PdfResizerSection';

type ImageFormat = 'jpeg' | 'png' | 'webp';

export const PhotoResizerSection: React.FC = () => {
  // Main Tab State ('photo' vs 'pdf')
  const [mainTab, setMainTab] = useState<'photo' | 'pdf'>('photo');

  // Original Image State (Initial null as requested - no demo image)
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('photo.jpg');
  const [originalSizeBytes, setOriginalSizeBytes] = useState<number>(0);

  // Settings
  const [format, setFormat] = useState<ImageFormat>('jpeg');
  const [quality, setQuality] = useState<number>(65);

  // Photo Editing Controls
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);

  // Crop & Edit Modal States
  const [showCropModal, setShowCropModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  // Handle Edit Complete
  const handleEditComplete = (editedDataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      loadedImageRef.current = img;
      setImageSrc(editedDataUrl);
      setStatusMsg('✓ फोटो एडिटिंग (ब्राईटनेस/कॉन्ट्रास्ट) यशस्वीपणे लागू झाले!');
      setTimeout(() => setStatusMsg(null), 3000);
    };
    img.src = editedDataUrl;
  };
  
  // Dimensions inputs (strings for smooth typing without glitching)
  const [widthStr, setWidthStr] = useState<string>('160');
  const [heightStr, setHeightStr] = useState<string>('202');
  
  // Lock aspect ratio is UNLOCKED by default
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<number>(160 / 202);

  // Transformation
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // Zoom
  const [zoom, setZoom] = useState<number>(1);

  // Full Screen Preview Modal State & Hand Drag Pan State
  const [showFullPreviewModal, setShowFullPreviewModal] = useState<boolean>(false);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanDragging, setIsPanDragging] = useState<boolean>(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDownPan = (e: React.MouseEvent) => {
    setIsPanDragging(true);
    setDragStartPos({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMovePan = (e: React.MouseEvent) => {
    if (!isPanDragging) return;
    setPanOffset({
      x: e.clientX - dragStartPos.x,
      y: e.clientY - dragStartPos.y,
    });
  };

  const handleMouseUpPan = () => {
    setIsPanDragging(false);
  };

  const handleTouchStartPan = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanDragging(true);
      const touch = e.touches[0];
      setDragStartPos({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
    }
  };

  const handleTouchMovePan = (e: React.TouchEvent) => {
    if (isPanDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      setPanOffset({
        x: touch.clientX - dragStartPos.x,
        y: touch.clientY - dragStartPos.y,
      });
    }
  };

  const handleTouchEndPan = () => {
    setIsPanDragging(false);
  };

  const handleWheelZoom = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(4.0, Math.round((z + 0.15) * 100) / 100));
    } else if (e.deltaY > 0) {
      setZoom((z) => Math.max(0.3, Math.round((z - 0.15) * 100) / 100));
    }
  };

  const handleResetPanAndZoom = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoom(1);
  };

  // Target KB Modal
  const [showTargetKbModal, setShowTargetKbModal] = useState<boolean>(false);
  const [targetKbInput, setTargetKbInput] = useState<number>(15);

  // Processed Output State
  const [optimizedDataUrl, setOptimizedDataUrl] = useState<string | null>(null);
  const [optimizedSizeBytes, setOptimizedSizeBytes] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  useRegisterShortcuts({
    onSave: () => handleDownload(),
  });

  // Handle Crop Complete
  const handleCropComplete = (croppedDataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      loadedImageRef.current = img;
      setImageSrc(croppedDataUrl);
      const ratio = img.width / img.height;
      setAspectRatio(ratio);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setZoom(1);
      setStatusMsg('✓ फोटो यशस्वीपणे क्रॉप झाला!');
      setTimeout(() => setStatusMsg(null), 3000);
    };
    img.src = croppedDataUrl;
  };

  // Calculate clean KB string
  const originalKb = (originalSizeBytes / 1024).toFixed(2);
  const optimizedKb = (optimizedSizeBytes / 1024).toFixed(2);

  const numWidth = Math.max(10, parseInt(widthStr) || 160);
  const numHeight = Math.max(10, parseInt(heightStr) || 202);

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setOriginalSizeBytes(file.size);

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          loadedImageRef.current = img;
          setImageSrc(dataUrl);
          const ratio = img.width / img.height;
          setAspectRatio(ratio);
          setRotation(0);
          setFlipH(false);
          setFlipV(false);
          setZoom(1);
          setBrightness(100);
          setContrast(100);
          setStatusMsg('✓ फोटो यशस्वीपणे अपलोड झाला!');
          setTimeout(() => setStatusMsg(null), 3000);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  // Dimension Input Handlers
  const handleWidthChange = (val: string) => {
    setWidthStr(val);
    const w = parseInt(val);
    if (lockAspectRatio && !isNaN(w) && w > 0 && aspectRatio > 0) {
      setHeightStr(Math.round(w / aspectRatio).toString());
    }
  };

  const handleHeightChange = (val: string) => {
    setHeightStr(val);
    const h = parseInt(val);
    if (lockAspectRatio && !isNaN(h) && h > 0 && aspectRatio > 0) {
      setWidthStr(Math.round(h * aspectRatio).toString());
    }
  };

// JPEG Padding Helper to ensure output file size strictly meets minimum KB requirements (e.g. 12-20 KB for Photo, 8-20 KB for Signature)
function padJpegDataUrl(dataUrl: string, targetBytes: number): { dataUrl: string; sizeInBytes: number } {
  if (!dataUrl.startsWith('data:image/jpeg')) {
    const base64Str = dataUrl.substring(dataUrl.indexOf(',') + 1);
    const bytes = Math.round((base64Str.length * 3) / 4);
    return { dataUrl, sizeInBytes: bytes };
  }

  try {
    const base64Parts = dataUrl.split(',');
    const header = base64Parts[0];
    const rawBase64 = base64Parts[1];
    
    const binaryStr = atob(rawBase64);
    const origLen = binaryStr.length;
    
    if (origLen >= targetBytes) {
      return { dataUrl, sizeInBytes: origLen };
    }

    const originalUint8 = new Uint8Array(origLen);
    for (let i = 0; i < origLen; i++) {
      originalUint8[i] = binaryStr.charCodeAt(i);
    }

    if (originalUint8[0] !== 0xff || originalUint8[1] !== 0xd8) {
      return { dataUrl, sizeInBytes: origLen };
    }

    let needed = targetBytes - origLen;
    const comSegments: Uint8Array[] = [];

    while (needed >= 5) {
      const payloadLen = Math.min(needed - 4, 65533);
      if (payloadLen <= 0) break;
      const segmentLen = payloadLen + 2;

      const seg = new Uint8Array(4 + payloadLen);
      seg[0] = 0xff;
      seg[1] = 0xfe;
      seg[2] = (segmentLen >> 8) & 0xff;
      seg[3] = segmentLen & 0xff;
      seg.fill(0x20, 4);

      comSegments.push(seg);
      needed -= (4 + payloadLen);
    }

    let totalSegLen = 0;
    for (const seg of comSegments) totalSegLen += seg.length;

    const paddedUint8 = new Uint8Array(origLen + totalSegLen);
    paddedUint8[0] = 0xff;
    paddedUint8[1] = 0xd8;

    let offset = 2;
    for (const seg of comSegments) {
      paddedUint8.set(seg, offset);
      offset += seg.length;
    }

    paddedUint8.set(originalUint8.subarray(2), offset);

    let binary = '';
    const chunk = 8192;
    for (let i = 0; i < paddedUint8.length; i += chunk) {
      binary += String.fromCharCode.apply(null, Array.from(paddedUint8.subarray(i, i + chunk)));
    }
    const newBase64 = btoa(binary);
    const newUrl = `${header},${newBase64}`;
    
    return { dataUrl: newUrl, sizeInBytes: paddedUint8.length };
  } catch (err) {
    console.error('JPEG padding error:', err);
    const base64Str = dataUrl.substring(dataUrl.indexOf(',') + 1);
    const bytes = Math.round((base64Str.length * 3) / 4);
    return { dataUrl, sizeInBytes: bytes };
  }
}

  // Auto Compress / Set Preset Range (Photo 12-20 KB, Signature 8-20 KB)
  const applyPresetWithKbTarget = (w: number, h: number, minKb: number, maxKb: number) => {
    setWidthStr(w.toString());
    setHeightStr(h.toString());
    setQuality(65);

    if (!loadedImageRef.current) return;

    const targetKb = w === 160 ? 15.5 : 13.5;
    setStatusMsg(`✓ ${w}×${h}px सेट झाले | Quality: 65% (~${targetKb.toFixed(1)} KB)`);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // Main Canvas Rendering Logic
  const processImage = useCallback(() => {
    if (!loadedImageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = numWidth;
    canvas.height = numHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, numWidth, numHeight);

    if (format === 'jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, numWidth, numHeight);
    }

    ctx.save();

    const centerX = numWidth / 2;
    const centerY = numHeight / 2;
    ctx.translate(centerX, centerY);

    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // Apply Brightness & Contrast filter
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    const img = loadedImageRef.current;
    ctx.drawImage(img, -numWidth / 2, -numHeight / 2, numWidth, numHeight);
    ctx.restore();

    const mimeType = `image/${format}`;
    const q = quality / 100;
    let dataUrl = canvas.toDataURL(mimeType, q);

    let base64Str = dataUrl.substring(dataUrl.indexOf(',') + 1);
    let sizeInBytes = Math.round((base64Str.length * 3) / 4);

    // Auto Target KB padding/compression rules for Government Presets
    if (format === 'jpeg') {
      let minBytes = 0;
      let idealBytes = 0;
      let maxBytes = 0;

      if (numWidth === 160 && numHeight === 202) {
        // Photo: 12-20 KB range (Ideal 15.5 KB)
        minBytes = 12 * 1024;
        idealBytes = 15.5 * 1024;
        maxBytes = 20 * 1024;
      } else if (numWidth === 256 && numHeight === 64) {
        // Signature: 8-20 KB range (Ideal 13.5 KB)
        minBytes = 8 * 1024;
        idealBytes = 13.5 * 1024;
        maxBytes = 20 * 1024;
      }

      if (minBytes > 0 && sizeInBytes < minBytes) {
        const padded = padJpegDataUrl(dataUrl, idealBytes);
        dataUrl = padded.dataUrl;
        sizeInBytes = padded.sizeInBytes;
      } else if (maxBytes > 0 && sizeInBytes > maxBytes) {
        let lowQ = 0.01;
        let highQ = q;
        for (let i = 0; i < 8; i++) {
          const midQ = (lowQ + highQ) / 2;
          const testUrl = canvas.toDataURL(mimeType, midQ);
          const testBase64 = testUrl.substring(testUrl.indexOf(',') + 1);
          const testBytes = Math.round((testBase64.length * 3) / 4);
          if (testBytes <= maxBytes) {
            dataUrl = testUrl;
            sizeInBytes = testBytes;
            lowQ = midQ;
          } else {
            highQ = midQ;
          }
        }
      }
    }

    setOptimizedDataUrl(dataUrl);
    setOptimizedSizeBytes(sizeInBytes);
  }, [numWidth, numHeight, rotation, flipH, flipV, format, quality, brightness, contrast]);

  useEffect(() => {
    if (imageSrc) {
      processImage();
    }
  }, [processImage, imageSrc]);

  // Compress to Target KB Modal Handler
  const handleCompressToTargetKb = (targetKb: number) => {
    if (!loadedImageRef.current || !canvasRef.current) return;
    const targetBytes = targetKb * 1024;

    const canvas = canvasRef.current;
    const mimeType = `image/${format}`;

    let lowQ = 0.01;
    let highQ = 0.99;
    let bestQ = quality / 100;
    let bestBytes = optimizedSizeBytes;
    let bestUrl = canvas.toDataURL(mimeType, bestQ);

    for (let i = 0; i < 12; i++) {
      let midQ = (lowQ + highQ) / 2;
      let testUrl = canvas.toDataURL(mimeType, midQ);
      let base64Str = testUrl.substring(testUrl.indexOf(',') + 1);
      let testBytes = Math.round((base64Str.length * 3) / 4);

      if (Math.abs(testBytes - targetBytes) < Math.abs(bestBytes - targetBytes)) {
        bestQ = midQ;
        bestBytes = testBytes;
        bestUrl = testUrl;
      }

      if (testBytes > targetBytes) {
        highQ = midQ;
      } else {
        lowQ = midQ;
      }
    }

    if (format === 'jpeg' && bestBytes < targetBytes) {
      const padded = padJpegDataUrl(bestUrl, targetBytes);
      bestUrl = padded.dataUrl;
      bestBytes = padded.sizeInBytes;
    }

    setQuality(Math.max(1, Math.min(100, Math.round(bestQ * 100))));
    setOptimizedDataUrl(bestUrl);
    setOptimizedSizeBytes(bestBytes);
    setShowTargetKbModal(false);
    setStatusMsg(`✓ ${(bestBytes / 1024).toFixed(2)} KB साईझ सेट झाली!`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Download Handler
  const handleDownload = () => {
    if (!optimizedDataUrl) return;
    const link = document.createElement('a');
    const ext = format === 'jpeg' ? 'jpg' : format;
    const cleanName = fileName.replace(/\.[^/.]+$/, '');
    link.download = `${cleanName}_${numWidth}x${numHeight}_${optimizedKb}KB.${ext}`;
    link.href = optimizedDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setStatusMsg(`✓ ${optimizedKb} KB फाईल यशस्वीपणे डाऊनलोड झाली!`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Delete / Clear Uploaded Photo
  const handleDeletePhoto = () => {
    setImageSrc(null);
    setOptimizedDataUrl(null);
    setFileName('photo.jpg');
    setOriginalSizeBytes(0);
    setOptimizedSizeBytes(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setStatusMsg('फोटो हटवला (Photo Removed)');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 py-2 text-slate-800 dark:text-slate-100 select-none">
      
      {/* TOP 2 NAVIGATION BUTTONS: PHOTO RESIZE & PDF RESIZE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm flex items-center justify-center sm:justify-start gap-2">
        <button
          onClick={() => setMainTab('photo')}
          className={`flex-1 sm:flex-initial px-6 py-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            mainTab === 'photo'
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Photo Resize (फोटो रिसायझर)</span>
        </button>

        <button
          onClick={() => setMainTab('pdf')}
          className={`flex-1 sm:flex-initial px-6 py-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            mainTab === 'pdf'
              ? 'bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 text-white shadow-lg shadow-red-500/25 ring-2 ring-red-400/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>PDF Resize (पीडीएफ रिसायझर)</span>
        </button>
      </div>

      {mainTab === 'pdf' ? (
        <PdfResizerSection />
      ) : (
        <>
          {/* HEADER BAR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-xl border border-blue-200 dark:border-blue-900">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight">Photo & PDF Resizer</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  फोटो व पीडीएफ पिक्सेल आणि KB साईझनुसार एकाच ठिकाणी रिसायझ व कॉम्प्रेस करा
                </p>
              </div>
            </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 ring-2 ring-blue-400/20 flex items-center gap-2.5 transition-all cursor-pointer active:scale-95 group"
          >
            <div className="p-1 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <span className="tracking-wide">{imageSrc ? 'दुसरा फोटो निवडा' : 'फोटो / सही अपलोड करा'}</span>
          </button>

          {imageSrc && (
            <button
              onClick={handleDeletePhoto}
              className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-rose-500/20 hover:shadow-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              title="फोटो हटवा (Delete Photo)"
            >
              <Trash2 className="w-4 h-4" />
              <span>डिलीट करा</span>
            </button>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />
      </div>

      {/* NOTIFICATION TOAST */}
      {statusMsg && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-emerald-200 hover:text-white font-bold">
            ×
          </button>
        </div>
      )}

      {/* SIDE-BY-SIDE PREVIEW PANELS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          
          {/* LEFT PANEL: ORIGINAL IMAGE */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">मूलभूत फोटो (Original)</span>
              {imageSrc && (
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-slate-700 dark:text-slate-200 text-xs px-2.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-xs">
                    {originalKb} KB
                  </span>
                  <button
                    onClick={handleDeletePhoto}
                    className="px-2 py-0.5 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-md transition-all cursor-pointer flex items-center gap-1 text-xs font-extrabold border border-rose-200 dark:border-rose-900"
                    title="फोटो डिलीट करा"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>डिलीट</span>
                  </button>
                </div>
              )}
            </div>

            <div 
              onClick={() => !imageSrc && fileInputRef.current?.click()}
              className={`flex-1 p-3 flex flex-col items-center justify-center min-h-[280px] max-h-[340px] overflow-auto relative ${
                !imageSrc ? 'bg-slate-50 hover:bg-blue-50/50 dark:bg-slate-900/40 dark:hover:bg-slate-900/80 cursor-pointer border-2 border-dashed border-blue-300 hover:border-blue-500 dark:border-slate-700 dark:hover:border-blue-500 m-3 rounded-2xl transition-all' : 'bg-slate-100/50 dark:bg-slate-900/50'
              }`}
            >
              {imageSrc ? (
                <div className="relative group">
                  <img
                    src={imageSrc}
                    alt="Original"
                    className="max-h-[280px] w-auto object-contain shadow-md border border-slate-300 dark:border-slate-700 rounded-lg bg-white cursor-pointer"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                    onClick={() => {
                      setPanOffset({ x: 0, y: 0 });
                      setShowFullPreviewModal(true);
                    }}
                    title="फुल स्क्रीन प्रिव्ह्यूसाठी क्लिक करा"
                  />
                  <button
                    onClick={handleDeletePhoto}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg shadow-md opacity-90 group-hover:opacity-100 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-extrabold backdrop-blur-xs"
                    title="फोटो डिलीट करा"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>डिलीट</span>
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-3 p-6 flex flex-col items-center justify-center group">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ring-4 ring-blue-100 dark:ring-blue-950">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      फोटो किंवा स्वाक्षरी निवडा (Upload Photo)
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      येथे क्लिक करून फाईल सिलेक्ट करा (JPG, PNG, WEBP)
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/25 flex items-center gap-2 group-hover:shadow-blue-600/40 transition-all cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>फोटो ब्राउझ करा (Browse Photo)</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: OPTIMIZED RESIZED IMAGE */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">रिसायझ्ड फोटो (Output)</span>
              {imageSrc && (
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-md shadow-xs">
                    {optimizedKb} KB ({numWidth}×{numHeight}px)
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 p-3 flex items-center justify-center bg-slate-100/50 dark:bg-slate-900/50 min-h-[280px] max-h-[340px] overflow-auto relative">
              {imageSrc ? (
                <canvas
                  ref={canvasRef}
                  className="max-h-[280px] w-auto object-contain shadow-md border border-slate-300 dark:border-slate-700 rounded-lg bg-white cursor-pointer"
                  onClick={() => {
                    setPanOffset({ x: 0, y: 0 });
                    setShowFullPreviewModal(true);
                  }}
                  title="फुल स्क्रीन प्रिव्ह्यूसाठी क्लिक करा"
                />
              ) : (
                <div className="text-center text-xs text-slate-400 space-y-1">
                  <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                  <div>फोटो अपलोड केल्यावर येथे रिसायझ्ड व्ह्यू दिसेल</div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* COMBINED TOOLBAR ACTIONS (SINGLE LINE ALIGNMENT) */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          
          {/* FORMAT SWITCHER */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <button
              onClick={() => setFormat('jpeg')}
              className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer ${
                format === 'jpeg'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              JPEG
            </button>
            <button
              onClick={() => setFormat('png')}
              className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer ${
                format === 'png'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              PNG
            </button>
            <button
              onClick={() => setFormat('webp')}
              className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer ${
                format === 'webp'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              WEBP
            </button>
          </div>

          {/* 1 SINGLE COMBINED POPUP BUTTON: PHOTO EDIT & CROP */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                if (!imageSrc) {
                  setStatusMsg('कृपया आधी फोटो निवडा/अपलोड करा.');
                  setTimeout(() => setStatusMsg(null), 3000);
                  return;
                }
                setShowEditModal(true);
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 hover:from-emerald-700 hover:to-purple-700 text-white font-extrabold rounded-xl flex items-center gap-1.5 shadow-xs hover:shadow-md cursor-pointer active:scale-95 transition-all text-xs"
              title="फोटो आणि सही क्रॉप किंवा एडिट करण्यासाठी १-क्लिक पॉपअप"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>एडिट व क्रॉप</span>
            </button>
          </div>

          {/* ZOOM TOOLBAR ACTIONS */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider">Zoom:</span>
            
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
              className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <button
              onClick={() => setZoom(1)}
              className="px-2.5 py-1 text-[11px] font-mono font-extrabold bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95"
              title="1:1 Reset Zoom"
            >
              1:1
            </button>

            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.15))}
              className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <span className="text-[10px] font-mono font-bold text-slate-500 px-1.5">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* TRANSFORMATION & COMPRESS ACTIONS */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setRotation((r) => (r + 270) % 360)}
              className="p-2 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer active:scale-95"
              title="Rotate Counter-Clockwise (270°)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-2 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer active:scale-95"
              title="Rotate Clockwise (90°)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setFlipH((f) => !f)}
              className={`p-2 rounded-xl border shadow-2xs cursor-pointer active:scale-95 ${
                flipH 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 border-blue-400' 
                  : 'bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
              }`}
              title="Flip Horizontally"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>

            <button
              onClick={() => setFlipV((f) => !f)}
              className={`p-2 rounded-xl border shadow-2xs cursor-pointer active:scale-95 ${
                flipV 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 border-blue-400' 
                  : 'bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
              }`}
              title="Flip Vertically"
            >
              <FlipVertical className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowTargetKbModal(true)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 text-xs"
              title="विशिष्ट KB मध्ये फोटो कॉम्प्रेस करा"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-200" />
              <span>कॉम्प्रेस KB</span>
            </button>
          </div>

        </div>

        {/* SETTINGS CARD SECTION (QUALITY, DIMENSIONS & PHOTO EDITING BRIGHTNESS/CONTRAST) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* QUALITY SLIDER CARD */}
          <div className="md:col-span-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between font-extrabold text-slate-800 dark:text-slate-100 text-xs">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Quality (कॉम्प्रेशन क्वालिटी)
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Math.max(1, Math.min(100, parseInt(e.target.value) || 75)))}
                  className="w-14 p-1 text-center font-mono font-extrabold text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-2xs text-blue-600 dark:text-blue-400"
                />
                <span className="font-extrabold text-slate-500">%</span>
              </div>
            </div>

            <input
              type="range"
              min="1"
              max="100"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
          </div>

          {/* WIDTH & HEIGHT CARD WITH 1-CLICK PRESETS */}
          <div className="md:col-span-7 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            
            {/* CARD TITLE & PRESET BUTTONS */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-blue-600" />
                Width & Height (पिक्सेल साईझ)
              </span>

              {/* 1-CLICK PRESET BUTTONS */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyPresetWithKbTarget(160, 202, 12, 20)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span>📷 160×202 (फोटो) [12-20 KB]</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetWithKbTarget(256, 64, 8, 20)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span>✍️ 256×64 (सही) [8-20 KB]</span>
                </button>
              </div>
            </div>

            {/* INPUT FIELDS AND UNLOCK TOGGLE */}
            <div className="flex items-center gap-2">
              {/* WIDTH INPUT */}
              <div className="flex-1 flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 p-2 rounded-xl shadow-2xs">
                <span className="text-xs text-slate-400 font-extrabold pl-1">W:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={widthStr}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  placeholder="Width"
                  className="w-full font-mono font-extrabold text-sm text-center bg-transparent focus:outline-none text-slate-800 dark:text-slate-100"
                />
                <span className="text-[10px] font-bold text-slate-400 pr-1">px</span>
              </div>

              {/* LOCK / UNLOCK TOGGLE BUTTON */}
              <button
                type="button"
                onClick={() => {
                  const next = !lockAspectRatio;
                  setLockAspectRatio(next);
                  if (next) {
                    const w = parseInt(widthStr) || 160;
                    const h = parseInt(heightStr) || 202;
                    if (h > 0) setAspectRatio(w / h);
                  }
                }}
                className={`p-2.5 rounded-xl border shadow-2xs cursor-pointer active:scale-95 flex items-center justify-center transition-all ${
                  lockAspectRatio
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 border-blue-400'
                    : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                }`}
                title={lockAspectRatio ? 'Aspect Ratio Locked' : 'Aspect Ratio Unlocked'}
              >
                {lockAspectRatio ? (
                  <Lock className="w-5 h-5 text-blue-600" />
                ) : (
                  <Unlock className="w-5 h-5 text-slate-500" />
                )}
              </button>

              {/* HEIGHT INPUT */}
              <div className="flex-1 flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 p-2 rounded-xl shadow-2xs">
                <span className="text-xs text-slate-400 font-extrabold pl-1">H:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={heightStr}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  placeholder="Height"
                  className="w-full font-mono font-extrabold text-sm text-center bg-transparent focus:outline-none text-slate-800 dark:text-slate-100"
                />
                <span className="text-[10px] font-bold text-slate-400 pr-1">px</span>
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM CENTERED DOWNLOAD ACTION BAR */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-2">
          <button
            onClick={handleDownload}
            disabled={!optimizedDataUrl}
            className={`w-full sm:w-auto min-w-[320px] sm:min-w-[440px] px-8 py-4 font-extrabold text-sm rounded-2xl shadow-xl flex items-center justify-center gap-3.5 transition-all duration-200 ${
              optimizedDataUrl
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer active:scale-98 shadow-emerald-600/30 hover:shadow-2xl hover:shadow-emerald-600/40 ring-4 ring-emerald-500/20 hover:-translate-y-0.5'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-300 dark:border-slate-700'
            }`}
          >
            <div className={`p-2 rounded-xl transition-all ${optimizedDataUrl ? 'bg-white/20 text-white shadow-xs' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <Download className={`w-5 h-5 ${optimizedDataUrl ? 'animate-bounce' : ''}`} />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-black tracking-wide">
                डाऊनलोड करा (Download Photo)
              </span>
              <span className="text-[11px] font-mono font-bold opacity-90 flex items-center gap-1.5 mt-0.5">
                {imageSrc ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                    <span>{format.toUpperCase()} • {numWidth}×{numHeight}px • {optimizedKb} KB</span>
                  </>
                ) : (
                  <span>आधी फोटो अपलोड करा (Upload Photo First)</span>
                )}
              </span>
            </div>
          </button>
        </div>

      </div>

      {/* COMPRESS TO TARGET SIZE MODAL */}
      {showTargetKbModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-600" />
              Compress to Target Size (लक्ष्य KB)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              हवी असणारी फाईल साईझ (KB मध्ये) टाका:
            </p>

            <div className="space-y-2">
              <div className="relative">
                <input
                  type="number"
                  value={targetKbInput}
                  onChange={(e) => setTargetKbInput(Math.max(2, parseInt(e.target.value) || 15))}
                  className="w-full p-2.5 text-sm font-mono font-extrabold bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
                <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold">KB</span>
              </div>
            </div>

            {/* Quick KB Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              {[12, 15, 20, 30, 40, 50].map((presetKb) => (
                <button
                  key={presetKb}
                  onClick={() => setTargetKbInput(presetKb)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-mono font-extrabold border cursor-pointer ${
                    targetKbInput === presetKb
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {presetKb}KB
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowTargetKbModal(false)}
                className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 cursor-pointer"
              >
                रद्द करा
              </button>
              <button
                onClick={() => handleCompressToTargetKb(targetKbInput)}
                className="px-4 py-2 text-xs font-extrabold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow cursor-pointer"
              >
                कॉम्प्रेस करा
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO CROP MODAL */}
      {showCropModal && imageSrc && (
        <PhotoCropModal
          isOpen={showCropModal}
          onClose={() => setShowCropModal(false)}
          imageSrc={imageSrc}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* PHOTO EDIT MODAL */}
      {showEditModal && imageSrc && (
        <PhotoEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          imageSrc={imageSrc}
          onEditComplete={handleEditComplete}
        />
      )}

      {/* PHOTO FULL SCREEN PREVIEW MODAL WITH HAND DRAG PAN & MOUSE SCROLL ZOOM */}
      {showFullPreviewModal && (imageSrc || optimizedDataUrl) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col z-50 p-2 sm:p-4 animate-fadeIn">
          {/* MODAL HEADER */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-t-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
                  <span>Photo Full Preview (फोटो पूर्ण प्रिव्ह्यू)</span>
                  <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md font-mono font-bold border border-emerald-400/30">
                    {format.toUpperCase()} • {numWidth}×{numHeight}px
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                  {fileName} • {optimizedKb} KB
                </p>
              </div>
            </div>

            {/* HEADER CONTROLS */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">डाऊनलोड करा</span>
              </button>

              <button
                onClick={() => setShowFullPreviewModal(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl cursor-pointer font-extrabold text-xs transition-all border border-slate-700"
                title="प्रिव्ह्यू बंद करा"
              >
                ✕ बंद करा
              </button>
            </div>
          </div>

          {/* MODAL BODY DISPLAY WITH HAND DRAG PAN & MOUSE SCROLL ZOOM */}
          <div 
            className={`flex-1 bg-slate-950 p-4 overflow-hidden flex items-center justify-center relative border-x border-slate-800 select-none ${
              isPanDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onWheel={handleWheelZoom}
            onMouseDown={handleMouseDownPan}
            onMouseMove={handleMouseMovePan}
            onMouseUp={handleMouseUpPan}
            onMouseLeave={handleMouseUpPan}
            onTouchStart={handleTouchStartPan}
            onTouchMove={handleTouchMovePan}
            onTouchEnd={handleTouchEndPan}
          >
            {/* Hand Drag & Scroll Zoom Helper Hint Badge */}
            <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md text-amber-300 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 z-20 pointer-events-none shadow-md">
              <span className="text-sm">🖐️</span>
              <span>हाताने/माऊसने पकडून फिरवा • 🔍 माऊस स्क्रोलने Zoom In/Out करा</span>
            </div>

            <div 
              className="relative max-w-full max-h-full flex flex-col items-center justify-center my-auto transition-transform duration-75 ease-out shadow-2xl rounded-lg border border-slate-700 bg-white"
              style={{ 
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                transformOrigin: 'center center'
              }}
            >
              <img
                src={optimizedDataUrl || imageSrc || ''}
                alt="Full Photo Preview"
                className="max-h-[75vh] w-auto object-contain bg-white rounded-lg shadow-2xl pointer-events-none"
              />
            </div>
          </div>

          {/* MODAL FOOTER CONTROLS */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-b-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono text-[11px]">
                साईझ: {optimizedKb} KB ({numWidth}×{numHeight}px)
              </span>
            </div>

            {/* Zoom & Pan Reset Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetPanAndZoom}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg cursor-pointer border border-slate-700 text-[11px] font-mono"
                title="रिसेट पोझिशन (Reset Pan & Zoom)"
              >
                ↺ Reset View
              </button>

              <button
                onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer border border-slate-700"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono font-bold w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(3.0, z + 0.2))}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer border border-slate-700"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                onClick={handleDownload}
                className="ml-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>डाऊनलोड</span>
              </button>
            </div>
          </div>
        </div>
      )}

        </>
      )}

    </div>
  );
};


