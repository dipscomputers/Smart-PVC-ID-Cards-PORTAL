import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Sliders, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  FileCheck, 
  Layers, 
  ZoomIn, 
  ZoomOut,
  Palette,
  Eye,
  AlertCircle
} from 'lucide-react';
import jsPDF from 'jspdf';

// PDF.js import
import * as pdfjsLib from 'pdfjs-dist';

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;

interface PdfResizerSectionProps {
  onBackToPhoto?: () => void;
}

export const PdfResizerSection: React.FC<PdfResizerSectionProps> = () => {
  // File States
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('document.pdf');
  const [originalSizeBytes, setOriginalSizeBytes] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Settings
  const [quality, setQuality] = useState<number>(70); // 1-100%
  const [targetKbInput, setTargetKbInput] = useState<number>(200);

  // DPI Settings (150, 200, 300, Custom) - Default set to 200 DPI
  const [selectedDpiType, setSelectedDpiType] = useState<'150' | '200' | '300' | 'custom'>('200');
  const [dpiValue, setDpiValue] = useState<number>(200);
  const [customDpiInput, setCustomDpiInput] = useState<number>(200);
  const [dpiScale, setDpiScale] = useState<number>(200 / 96); // ~2.0833 for 200 DPI
  const [showFullPreviewModal, setShowFullPreviewModal] = useState<boolean>(false);

  // Full Preview Pan & Drag State (Hand grab movement)
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
    setZoom(1.0);
  };

  const [isGrayscale, setIsGrayscale] = useState<boolean>(false);
  const [showTargetKbModal, setShowTargetKbModal] = useState<boolean>(false);

  // Output States
  const [compressedPdfBlob, setCompressedPdfBlob] = useState<Blob | null>(null);
  const [compressedSizeBytes, setCompressedSizeBytes] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const compressedCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  // Convert bytes to readable string (KB/MB)
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Render current page onto original canvas
  const renderOriginalPage = useCallback(async (pageNum: number) => {
    if (!pdfDocRef.current || !originalCanvasRef.current) return;
    try {
      const page = await pdfDocRef.current.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      
      const canvas = originalCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
        canvas: canvas,
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Error rendering original PDF page:', err);
    }
  }, []);

  // Handle PDF File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setStatusMsg('कृपया केवळ PDF फाईल निवडा (Please upload PDF file only)');
      setTimeout(() => setStatusMsg(null), 3000);
      return;
    }

    try {
      setIsCompressing(true);
      setStatusMsg('PDF लोड होत आहे... (Loading PDF)');
      
      setPdfFile(file);
      setPdfFileName(file.name);
      setOriginalSizeBytes(file.size);
      setCurrentPage(1);

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      
      pdfDocRef.current = pdfDoc;
      setTotalPages(pdfDoc.numPages);

      // Render Page 1 preview
      await renderOriginalPage(1);

      // Auto compress with default settings
      await compressPDF(pdfDoc, quality, dpiScale, isGrayscale);

      setStatusMsg('PDF यशस्वीरित्या लोड व कॉम्प्रेस झाली!');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error('Failed to load PDF file:', err);
      setStatusMsg('PDF उघडण्यात अडचण आली. फाईल तपासा.');
      setTimeout(() => setStatusMsg(null), 4000);
    } finally {
      setIsCompressing(false);
    }
  };

  // Delete / Clear PDF
  const handleDeletePdf = () => {
    setPdfFile(null);
    setPdfFileName('document.pdf');
    setOriginalSizeBytes(0);
    setCompressedPdfBlob(null);
    setCompressedSizeBytes(0);
    setTotalPages(0);
    setCurrentPage(1);
    pdfDocRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setStatusMsg('PDF फाईल हटवली (PDF Removed)');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Main Core PDF Compression Logic using canvas & jsPDF
  const compressPDF = async (
    doc: pdfjsLib.PDFDocumentProxy,
    compQuality: number,
    scaleFactor: number,
    grayscale: boolean
  ) => {
    if (!doc) return;
    setIsCompressing(true);

    try {
      const numPages = doc.numPages;
      let targetPdf: jsPDF | null = null;

      const qualityValue = Math.max(0.1, Math.min(1.0, compQuality / 100));

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await doc.getPage(pageNum);
        const viewport = page.getViewport({ scale: scaleFactor });

        // Offscreen Canvas for rendering
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d', { alpha: false });

        if (!ctx) continue;

        // Fill white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Render PDF Page to Canvas
        await page.render({
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas,
        }).promise;

        // Apply Grayscale if selected
        if (grayscale) {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;     // Red
            data[i + 1] = avg; // Green
            data[i + 2] = avg; // Blue
          }
          ctx.putImageData(imgData, 0, 0);
        }

        // Render preview canvas for current page
        if (pageNum === currentPage && compressedCanvasRef.current) {
          const previewCanvas = compressedCanvasRef.current;
          previewCanvas.width = canvas.width;
          previewCanvas.height = canvas.height;
          const pCtx = previewCanvas.getContext('2d');
          if (pCtx) {
            pCtx.drawImage(canvas, 0, 0);
          }
        }

        // Convert canvas page image to compressed JPEG Data URL
        const imgJpegUrl = canvas.toDataURL('image/jpeg', qualityValue);

        // Calculate page dimensions in mm (A4 or custom orientation)
        const orientation = viewport.width > viewport.height ? 'landscape' : 'portrait';
        const pdfWidthMm = (viewport.width * 25.4) / (96 * scaleFactor);
        const pdfHeightMm = (viewport.height * 25.4) / (96 * scaleFactor);

        if (pageNum === 1) {
          targetPdf = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: [pdfWidthMm, pdfHeightMm],
            compress: true
          });
        } else if (targetPdf) {
          targetPdf.addPage([pdfWidthMm, pdfHeightMm], orientation);
        }

        if (targetPdf) {
          targetPdf.addImage(imgJpegUrl, 'JPEG', 0, 0, pdfWidthMm, pdfHeightMm, undefined, 'FAST');
        }
      }

      if (targetPdf) {
        const outputBlob = targetPdf.output('blob');
        setCompressedPdfBlob(outputBlob);
        setCompressedSizeBytes(outputBlob.size);
      }
    } catch (err) {
      console.error('Error compressing PDF:', err);
      setStatusMsg('कॉम्प्रेशन करताना त्रुटी आली.');
      setTimeout(() => setStatusMsg(null), 3000);
    } finally {
      setIsCompressing(false);
    }
  };

  // Re-run compression when Quality, DPI scale, or Grayscale changes
  const handleApplySettings = async (
    newQuality: number = quality,
    newDpi: number = dpiScale,
    newGray: boolean = isGrayscale
  ) => {
    if (!pdfDocRef.current) return;
    await compressPDF(pdfDocRef.current, newQuality, newDpi, newGray);
  };

  // Handle DPI Selection (150 DPI, 200 DPI, 300 DPI, Custom)
  const handleSelectDpi = (type: '150' | '200' | '300' | 'custom', customVal?: number) => {
    setSelectedDpiType(type);
    let targetDpi = 200;
    if (type === '150') targetDpi = 150;
    else if (type === '200') targetDpi = 200;
    else if (type === '300') targetDpi = 300;
    else if (type === 'custom') targetDpi = customVal ?? customDpiInput;

    const clampedDpi = Math.max(72, Math.min(600, targetDpi));
    setDpiValue(clampedDpi);
    if (type === 'custom' && customVal !== undefined) {
      setCustomDpiInput(clampedDpi);
    }

    const calculatedScale = clampedDpi / 96;
    setDpiScale(calculatedScale);
    handleApplySettings(quality, calculatedScale, isGrayscale);
  };

  // Handle Target KB Auto Search
  const handleCompressToTargetKb = async (targetKb: number) => {
    if (!pdfDocRef.current) return;
    setShowTargetKbModal(false);
    setIsCompressing(true);
    setStatusMsg(`लक्ष्य ${targetKb} KB साठी कॉम्प्रेशन होत आहे...`);

    const targetBytes = targetKb * 1024;
    let bestQuality = 60;
    let bestDpi = 1.0;

    // Iterative search for quality setting
    if (originalSizeBytes > targetBytes) {
      const ratio = targetBytes / originalSizeBytes;
      if (ratio < 0.25) {
        bestQuality = 35;
        bestDpi = 0.85;
      } else if (ratio < 0.5) {
        bestQuality = 50;
        bestDpi = 1.0;
      } else {
        bestQuality = 70;
        bestDpi = 1.2;
      }
    } else {
      bestQuality = 85;
      bestDpi = 1.25;
    }

    setQuality(bestQuality);
    setDpiScale(bestDpi);
    await compressPDF(pdfDocRef.current, bestQuality, bestDpi, isGrayscale);

    setStatusMsg(`लक्ष्य साईझनुरुप ${targetKb} KB कॉम्प्रेशन पूर्ण!`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Page Navigation
  const handlePrevPage = async () => {
    if (currentPage <= 1 || !pdfDocRef.current) return;
    const prev = currentPage - 1;
    setCurrentPage(prev);
    await renderOriginalPage(prev);
    if (pdfDocRef.current) {
      await compressPDF(pdfDocRef.current, quality, dpiScale, isGrayscale);
    }
  };

  const handleNextPage = async () => {
    if (currentPage >= totalPages || !pdfDocRef.current) return;
    const next = currentPage + 1;
    setCurrentPage(next);
    await renderOriginalPage(next);
    if (pdfDocRef.current) {
      await compressPDF(pdfDocRef.current, quality, dpiScale, isGrayscale);
    }
  };

  // Download Compressed PDF
  const handleDownloadPdf = () => {
    if (!compressedPdfBlob) return;
    const url = URL.createObjectURL(compressedPdfBlob);
    const link = document.createElement('a');
    
    // Add _compressed suffix
    const cleanName = pdfFileName.replace(/\.pdf$/i, '');
    link.href = url;
    link.download = `${cleanName}_compressed.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setStatusMsg('PDF यशस्वीरित्या डाऊनलोड झाली!');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <div className="space-y-4">
      {/* HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 dark:bg-red-950/60 text-red-600 rounded-xl border border-red-200 dark:border-red-900">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              PDF Resizer & Compressor (पीडीएफ साईझ रिड्यूसर)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              क्वालिटी न खराब करता पीडीएफची साईझ हव्या त्या KB मध्ये कमी करा
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35 ring-2 ring-red-400/20 flex items-center gap-2.5 transition-all cursor-pointer active:scale-95 group"
          >
            <div className="p-1 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <span className="tracking-wide">{pdfFile ? 'दुसरी PDF निवडा' : 'PDF फाईल अपलोड करा'}</span>
          </button>

          {pdfFile && (
            <button
              onClick={handleDeletePdf}
              className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-rose-500/20 hover:shadow-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              title="PDF फाईल हटवा (Delete PDF)"
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
          accept="application/pdf"
          className="hidden"
        />
      </div>

      {/* NOTIFICATION TOAST */}
      {statusMsg && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between text-xs font-semibold animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-emerald-200 hover:text-white font-bold cursor-pointer">
            ×
          </button>
        </div>
      )}

      {/* SIDE-BY-SIDE PREVIEW PANELS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          
          {/* LEFT PANEL: ORIGINAL PDF PREVIEW */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">मूळ PDF (Original File)</span>
              {pdfFile && (
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-slate-700 dark:text-slate-200 text-xs px-2.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-xs">
                    {formatFileSize(originalSizeBytes)}
                  </span>
                  <button
                    onClick={handleDeletePdf}
                    className="px-2 py-0.5 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-md transition-all cursor-pointer flex items-center gap-1 text-xs font-extrabold border border-rose-200 dark:border-rose-900"
                    title="PDF डिलीट करा"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>डिलीट</span>
                  </button>
                </div>
              )}
            </div>

            <div 
              onClick={() => !pdfFile && fileInputRef.current?.click()}
              className={`flex-1 p-3 flex flex-col items-center justify-center min-h-[300px] max-h-[380px] overflow-auto relative ${
                !pdfFile ? 'bg-slate-50 hover:bg-red-50/50 dark:bg-slate-900/40 dark:hover:bg-slate-900/80 cursor-pointer border-2 border-dashed border-red-300 hover:border-red-500 dark:border-slate-700 dark:hover:border-red-500 m-3 rounded-2xl transition-all' : 'bg-slate-100/50 dark:bg-slate-900/50'
              }`}
            >
              {pdfFile ? (
                <div className="relative group flex flex-col items-center">
                  <canvas
                    ref={originalCanvasRef}
                    className="max-h-[300px] w-auto object-contain shadow-md border border-slate-300 dark:border-slate-700 rounded-lg bg-white cursor-pointer"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                    onClick={() => {
                      setPanOffset({ x: 0, y: 0 });
                      setShowFullPreviewModal(true);
                    }}
                    title="फुल स्क्रीन प्रिव्ह्यूसाठी क्लिक करा"
                  />
                  <button
                    onClick={handleDeletePdf}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg shadow-md opacity-90 group-hover:opacity-100 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-extrabold backdrop-blur-xs"
                    title="PDF डिलीट करा"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>डिलीट</span>
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-3 p-6 flex flex-col items-center justify-center group">
                  <div className="p-4 bg-gradient-to-br from-red-500 to-orange-600 text-white rounded-2xl shadow-lg shadow-red-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ring-4 ring-red-100 dark:ring-red-950">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      पीडीएफ फाईल निवडा (Select PDF Document)
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      येथे क्लिक करून PDF निवडा (Max 50MB)
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-red-600/25 flex items-center gap-2 group-hover:shadow-red-600/40 transition-all cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>PDF ब्राउझ करा (Browse PDF)</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* PAGE NAVIGATION CONTROLS */}
            {pdfFile && totalPages > 0 && (
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>
                  पान {currentPage} / {totalPages} (Page {currentPage} of {totalPages})
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: COMPRESSED OUTPUT PREVIEW */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">कॉम्प्रेस्ड PDF (Output File)</span>
              {pdfFile && compressedSizeBytes > 0 && (
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-md shadow-xs">
                    {formatFileSize(compressedSizeBytes)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 p-3 flex items-center justify-center bg-slate-100/50 dark:bg-slate-900/50 min-h-[300px] max-h-[380px] overflow-auto relative">
              {pdfFile ? (
                <div className="relative flex flex-col items-center">
                  <canvas
                    ref={compressedCanvasRef}
                    className="max-h-[300px] w-auto object-contain shadow-md border border-slate-300 dark:border-slate-700 rounded-lg bg-white cursor-pointer"
                    onClick={() => {
                      setPanOffset({ x: 0, y: 0 });
                      setShowFullPreviewModal(true);
                    }}
                    title="फुल स्क्रीन प्रिव्ह्यूसाठी क्लिक करा"
                  />

                  {isCompressing && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 rounded-lg z-10">
                      <RefreshCw className="w-6 h-6 text-red-600 animate-spin" />
                      <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                        कॉम्प्रेशन प्रक्रिया सुरू आहे...
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-xs text-slate-400 space-y-1">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <div>PDF अपलोड केल्यावर येथे व्ह्यू दिसेल</div>
                </div>
              )}
            </div>

            {/* ZOOM ACTIONS */}
            {pdfFile && (
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-[11px] font-extrabold text-slate-500 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                  <span>प्रिव्ह्यू आणि झूम controls</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
                    className="p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md cursor-pointer hover:bg-slate-200"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[11px] font-bold px-1.5">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
                    className="p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md cursor-pointer hover:bg-slate-200"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* COMPRESSION CONTROLS BAR */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
          
          {/* QUALITY SLIDER & TARGET KB */}
          <div className="md:col-span-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between font-extrabold text-slate-800 dark:text-slate-100 text-xs">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                कॉम्प्रेशन क्वालिटी (Quality)
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) => {
                    const q = Math.max(10, Math.min(100, parseInt(e.target.value) || 60));
                    setQuality(q);
                    handleApplySettings(q, dpiScale, isGrayscale);
                  }}
                  className="w-14 p-1 text-center font-mono font-extrabold text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-2xs text-red-600 dark:text-red-400 focus:ring-2 focus:ring-red-500/20"
                />
                <span className="font-extrabold text-slate-500">%</span>
              </div>
            </div>

            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={(e) => {
                const q = parseInt(e.target.value);
                setQuality(q);
                handleApplySettings(q, dpiScale, isGrayscale);
              }}
              className="w-full accent-red-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />

            <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                निश्चित साईझ हवी आहे?
              </span>
              <button
                type="button"
                onClick={() => setShowTargetKbModal(true)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-extrabold text-[11px] rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>लक्ष्य (Target KB) निवडा</span>
              </button>
            </div>
          </div>

          {/* DPI CLARITY & COLOR MODE OPTIONS */}
          <div className="md:col-span-7 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-2xs">
            
            {/* DPI CLARITY HEADER & SELECTION */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-extrabold text-slate-800 dark:text-slate-100 text-xs">
                <span className="flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  DPI क्लॅरिटी पर्याय (मजकूर स्पष्ट वाचता येण्यासाठी)
                </span>
                <span className="font-mono text-[11px] px-2 py-0.5 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-extrabold rounded-md">
                  {dpiValue} DPI Active
                </span>
              </div>

              {/* DPI BUTTONS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: '150', label: '150 DPI', sub: 'स्पष्ट मजकूर' },
                  { id: '200', label: '200 DPI', sub: 'HD Clarity' },
                  { id: '300', label: '300 DPI', sub: 'प्रिंट क्वालिटी' },
                  { id: 'custom', label: 'कस्टम DPI', sub: 'Custom DPI' },
                ].map((dpiOpt) => {
                  const isSelected = selectedDpiType === dpiOpt.id;
                  return (
                    <button
                      key={dpiOpt.id}
                      type="button"
                      onClick={() => handleSelectDpi(dpiOpt.id as any)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-500/20 ring-2 ring-blue-400/30'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xs font-black tracking-tight">{dpiOpt.label}</span>
                      <span className={`text-[9px] font-bold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {dpiOpt.sub}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* CUSTOM DPI INPUT BOX */}
              {selectedDpiType === 'custom' && (
                <div className="pt-1 flex items-center gap-2 animate-fadeIn bg-blue-50/70 dark:bg-blue-950/40 p-2 rounded-xl border border-blue-200 dark:border-blue-900">
                  <span className="text-xs font-extrabold text-blue-900 dark:text-blue-200">
                    कस्टम DPI टाईप करा (72 - 600 DPI):
                  </span>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <input
                      type="number"
                      min="72"
                      max="600"
                      value={customDpiInput}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 150;
                        setCustomDpiInput(val);
                      }}
                      onBlur={() => handleSelectDpi('custom', customDpiInput)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSelectDpi('custom', customDpiInput);
                        }
                      }}
                      className="w-20 p-1.5 text-center font-mono font-black text-xs bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg text-blue-700 dark:text-blue-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleSelectDpi('custom', customDpiInput)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-lg shadow-xs cursor-pointer"
                    >
                      Set
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* COLOR MODE (COLOR / BLACK & WHITE) */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                रंग / कलर मोड (Color Mode):
              </span>

              <div className="inline-flex p-1 bg-slate-200 dark:bg-slate-900 rounded-xl border border-slate-300/80 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsGrayscale(false);
                    handleApplySettings(quality, dpiScale, false);
                  }}
                  className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    !isGrayscale
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                  <span>Color (रंगीत PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsGrayscale(true);
                    handleApplySettings(quality, dpiScale, true);
                  }}
                  className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    isGrayscale
                      ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <span>🏁 Black & White (राखाडी)</span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM DOWNLOAD ACTION BAR */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-2">

          <button
            onClick={handleDownloadPdf}
            disabled={!compressedPdfBlob || isCompressing}
            className={`w-full sm:w-auto min-w-[300px] sm:min-w-[400px] px-8 py-4 font-extrabold text-sm rounded-2xl shadow-xl flex items-center justify-center gap-3.5 transition-all duration-200 ${
              compressedPdfBlob && !isCompressing
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white cursor-pointer active:scale-98 shadow-red-600/30 hover:shadow-2xl hover:shadow-red-600/40 ring-4 ring-red-500/20 hover:-translate-y-0.5'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-300 dark:border-slate-700'
            }`}
          >
            <div className={`p-2 rounded-xl transition-all ${compressedPdfBlob ? 'bg-white/20 text-white shadow-xs' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <Download className={`w-5 h-5 ${compressedPdfBlob ? 'animate-bounce' : ''}`} />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-black tracking-wide">
                डाऊनलोड करा (Download Compressed PDF)
              </span>
              <span className="text-[11px] font-mono font-bold opacity-90 flex items-center gap-1.5 mt-0.5">
                {pdfFile && compressedSizeBytes > 0 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                    <span>PDF • {totalPages} {totalPages > 1 ? 'Pages' : 'Page'} • {formatFileSize(compressedSizeBytes)}</span>
                  </>
                ) : (
                  <span>आधी PDF फाईल अपलोड करा</span>
                )}
              </span>
            </div>
          </button>
        </div>

      </div>

      {/* COMPRESS TO TARGET SIZE (KB) MODAL */}
      {showTargetKbModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-600" />
              Compress PDF to Target KB (लक्ष्य साईझ)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              हवी असणारी फाईल साईझ (KB मध्ये) टाका:
            </p>

            <div className="space-y-2">
              <div className="relative">
                <input
                  type="number"
                  value={targetKbInput}
                  onChange={(e) => setTargetKbInput(Math.max(20, parseInt(e.target.value) || 100))}
                  className="w-full p-2.5 text-sm font-mono font-extrabold bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
                <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold">KB</span>
              </div>
            </div>

            {/* Quick KB Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {[100, 200, 300, 500, 1000].map((presetKb) => (
                <button
                  key={presetKb}
                  onClick={() => setTargetKbInput(presetKb)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-mono font-extrabold border cursor-pointer ${
                    targetKbInput === presetKb
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {presetKb >= 1000 ? `${presetKb / 1000}MB` : `${presetKb}KB`}
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

      {/* FULL PAGE PREVIEW MODAL */}
      {showFullPreviewModal && pdfFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col z-50 p-2 sm:p-4 animate-fadeIn">
          {/* MODAL HEADER */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-t-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
                  <span>PDF Full Preview (पूर्ण प्रिव्ह्यू)</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-md font-mono font-bold border border-blue-400/30">
                    {dpiValue} DPI Active
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                  {pdfFileName} • {totalPages > 0 ? `पान ${currentPage} / ${totalPages}` : ''} • {formatFileSize(compressedSizeBytes)}
                </p>
              </div>
            </div>

            {/* HEADER CONTROLS */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={!compressedPdfBlob || isCompressing}
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

          {/* MODAL BODY CANVAS DISPLAY WITH HAND DRAG PAN & MOUSE SCROLL ZOOM */}
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

            {compressedCanvasRef.current ? (
              <div 
                className="relative max-w-full max-h-full flex flex-col items-center justify-center my-auto transition-transform duration-75 ease-out shadow-2xl rounded-lg border border-slate-700 bg-white"
                style={{ 
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                  transformOrigin: 'center center'
                }}
              >
                <img
                  src={compressedCanvasRef.current.toDataURL()}
                  alt="Full PDF Preview"
                  className="max-h-[75vh] w-auto object-contain bg-white rounded-lg shadow-2xl pointer-events-none"
                />
              </div>
            ) : (
              <div className="text-white text-xs font-bold">प्रिव्ह्यू उपलब्ध नाही.</div>
            )}
          </div>

          {/* MODAL FOOTER CONTROLS */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-b-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg text-xs font-bold">
            {/* Page Nav */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl cursor-pointer flex items-center gap-1 border border-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>मागील पान</span>
              </button>

              <span className="font-mono text-slate-300">
                पान {currentPage} / {totalPages}
              </span>

              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl cursor-pointer flex items-center gap-1 border border-slate-700"
              >
                <span>पुढील पान</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* DPI Quick Selector inside Modal */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 px-1 font-extrabold">DPI Change:</span>
              {(['150', '200', '300'] as const).map((dpiOpt) => (
                <button
                  key={dpiOpt}
                  onClick={() => handleSelectDpi(dpiOpt)}
                  className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg cursor-pointer transition-all ${
                    selectedDpiType === dpiOpt
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {dpiOpt} DPI
                </button>
              ))}
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
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
