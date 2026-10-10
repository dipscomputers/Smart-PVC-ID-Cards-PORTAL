import React, { useState, useRef } from 'react';
import { 
  Printer, 
  Download, 
  Upload, 
  FileText, 
  CheckCircle, 
  Loader2, 
  Sliders, 
  Trash2, 
  Plus, 
  AlertCircle,
  Sparkles,
  Layers,
  CreditCard,
  Grid,
  ShieldCheck,
  FileUp,
  FileCheck,
  ImageIcon
} from 'lucide-react';
import { useRegisterShortcuts } from '../context/ShortcutsContext';
import { printComponent } from '../utils/printHelper';
import { safeHtml2Canvas } from '../utils/safeHtml2Canvas';

import { 
  renderPdfFileToCanvas, 
  renderImageFileToCanvas, 
  cropCanvasToDataUrl, 
  DEFAULT_FRONT_CROP, 
  DEFAULT_BACK_CROP, 
  CropBox 
} from '../utils/pdfCardCropper';
import { PdfCropAdjustModal } from './PdfCropAdjustModal';
import { PdfPasswordModal } from './PdfPasswordModal';

export interface CroppedMahaCard {
  id: string;
  fileName: string;
  frontCardUrl: string;
  backCardUrl: string;
  pageImageUrl: string;
  frontCrop: CropBox;
  backCrop: CropBox;
}

export const MahaIdCardSection: React.FC = () => {
  const [cards, setCards] = useState<CroppedMahaCard[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'front' | 'back' | 'both'>('both');
  const [isUploading, setIsUploading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Crop Adjust Modal state
  const [isCropAdjustModalOpen, setIsCropAdjustModalOpen] = useState(false);

  // Password Modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pendingPasswordFile, setPendingPasswordFile] = useState<File | null>(null);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | null>(null);

  // Multi-card on 1 page view toggle
  const [printLayoutMode, setPrintLayoutMode] = useState<'single' | 'all-on-one-page'>('single');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCard = cards[activeCardIndex] || cards[0] || null;

  // Process a single file (with password handling)
  const processSingleFile = async (file: File, password?: string) => {
    setIsUploading(true);
    setUploadError(null);
    setPasswordErrorMessage(null);

    try {
      let canvas: HTMLCanvasElement;
      if (file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) {
        canvas = await renderPdfFileToCanvas(file, 2.5, password);
      } else {
        canvas = await renderImageFileToCanvas(file);
      }

      const pageImageUrl = canvas.toDataURL('image/jpeg', 0.85);

      // Crop Front and Back cards using calibrated coordinates
      const frontCardUrl = cropCanvasToDataUrl(canvas, DEFAULT_FRONT_CROP);
      const backCardUrl = cropCanvasToDataUrl(canvas, DEFAULT_BACK_CROP);

      const newCard: CroppedMahaCard = {
        id: `maha-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        fileName: file.name,
        frontCardUrl,
        backCardUrl,
        pageImageUrl,
        frontCrop: { ...DEFAULT_FRONT_CROP },
        backCrop: { ...DEFAULT_BACK_CROP },
      };

      setCards(prev => [...prev, newCard]);
      setActiveCardIndex(cards.length); // Switch to newly added card
      setIsPasswordModalOpen(false);
      setPendingPasswordFile(null);
    } catch (err: any) {
      if (err?.isPasswordRequired) {
        // Password is required for this file
        setPendingPasswordFile(file);
        setIsPasswordModalOpen(true);
        if (password) {
          setPasswordErrorMessage('पासवर्ड चुकीचा आहे, कृपया बरोबर पासवर्ड पुन्हा टाका.');
        } else {
          setPasswordErrorMessage(null);
        }
      } else {
        console.error(`Error processing ${file.name}:`, err);
        setUploadError(`फाईल वाचताना समस्या आली (${file.name}): ${err.message || ''}`);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Trigger file selection for single file upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSingleFile(file);
    }
  };

  // When user submits password in modal
  const handlePasswordSubmit = (enteredPassword: string) => {
    if (pendingPasswordFile) {
      processSingleFile(pendingPasswordFile, enteredPassword);
    }
  };

  // Re-crop card when user adjusts crop coordinates in modal
  const handleApplyAdjustedCrop = async (frontCrop: CropBox, backCrop: CropBox) => {
    if (!activeCard) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const newFrontUrl = cropCanvasToDataUrl(canvas, frontCrop);
        const newBackUrl = cropCanvasToDataUrl(canvas, backCrop);

        setCards(prev => {
          const next = [...prev];
          if (next[activeCardIndex]) {
            next[activeCardIndex] = {
              ...next[activeCardIndex],
              frontCardUrl: newFrontUrl,
              backCardUrl: newBackUrl,
              frontCrop,
              backCrop,
            };
          }
          return next;
        });
      }
    };
    img.src = activeCard.pageImageUrl;
  };

  // Delete individual card
  const handleDeleteCard = (indexToDelete: number) => {
    const filtered = cards.filter((_, i) => i !== indexToDelete);
    setCards(filtered);
    if (activeCardIndex >= filtered.length) {
      setActiveCardIndex(Math.max(0, filtered.length - 1));
    }
  };

  // Print on A4 page (Single active card or All cards on 1 A4 page)
  const handlePrint = async (mode: 'single' | 'all-on-one-page' = printLayoutMode) => {
    if (cards.length === 0) return;
    setIsPrinting(true);
    try {
      const targetElementId =
        mode === 'all-on-one-page' && cards.length > 1
          ? 'printable-maha-all-a4-sheet'
          : 'printable-maha-a4-sheet';

      const title =
        mode === 'all-on-one-page'
          ? `Maha_ID_All_${cards.length}_Cards_A4`
          : `Maha_ID_PVC_${activeCard?.fileName.replace(/\.[^/.]+$/, '')}`;

      await printComponent(targetElementId, title);
    } catch (err) {
      console.warn('Print error:', err);
    } finally {
      setIsPrinting(false);
    }
  };

  // Download high-resolution A4 PDF (Single active card or All cards on 1 A4 page)
  const handleDownloadPdf = async (mode: 'single' | 'all-on-one-page' = printLayoutMode) => {
    if (cards.length === 0) return;
    setIsExportingPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const cardW = 85.6;
      const cardH = 54.0;
      const gap = 2; // gap between front and back
      const leftMargin = (210 - (cardW * 2 + gap)) / 2; // exactly centered horizontally: 18.4 mm

      if (mode === 'all-on-one-page' && cards.length > 1) {
        // Place all cards on ONE single A4 page (up to 5 cards vertically)
        const rowGap = 3.0; // 3 mm gap between rows
        const startTop = 8.0; // 8 mm top margin

        const maxCardsOnPage = Math.min(cards.length, 5);
        for (let i = 0; i < maxCardsOnPage; i++) {
          const c = cards[i];
          const topMargin = startTop + i * (cardH + rowGap);

          if (c.frontCardUrl) {
            pdf.addImage(c.frontCardUrl, 'JPEG', leftMargin, topMargin, cardW, cardH);
          }
          if (c.backCardUrl) {
            pdf.addImage(c.backCardUrl, 'JPEG', leftMargin + cardW + gap, topMargin, cardW, cardH);
          }
        }
        pdf.save(`Maha_ID_All_${maxCardsOnPage}_Cards_A4.pdf`);
      } else if (activeCard) {
        // Single card at top with 10mm margin for PVC card tray/A4 print
        const topMargin = 10;
        if (activeCard.frontCardUrl) {
          pdf.addImage(activeCard.frontCardUrl, 'JPEG', leftMargin, topMargin, cardW, cardH);
        }
        if (activeCard.backCardUrl) {
          pdf.addImage(activeCard.backCardUrl, 'JPEG', leftMargin + cardW + gap, topMargin, cardW, cardH);
        }
        pdf.save(`Maha_ID_PVC_${activeCard.fileName.replace(/\.[^/.]+$/, '')}.pdf`);
      }

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const [isExportingJpg, setIsExportingJpg] = useState(false);

  const handleDownloadJpg = async () => {
    if (!activeCard) return;
    setIsExportingJpg(true);
    try {
      const isMulti = printLayoutMode === 'all-on-one-page' && cards.length > 1;
      const targetId = isMulti ? 'printable-maha-all-a4-sheet' : 'printable-maha-a4-sheet';
      const targetEl = document.getElementById(targetId);

      if (targetEl) {
        const canvas = await safeHtml2Canvas(targetEl, {
          scale: 3,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
        });
        const dataUrl = canvas.toDataURL('image/jpeg', 0.98);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `MAHA_ID_Card_${activeCard.fileName.replace(/\.[^/.]+$/, '')}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Direct Canvas Fallback
      const canvas = document.createElement('canvas');
      const pxPerMm = 11.81; // ~300 DPI
      const cardW = Math.round(85.6 * pxPerMm);
      const cardH = Math.round(54.0 * pxPerMm);
      const gap = Math.round(2 * pxPerMm);

      canvas.width = cardW * 2 + gap + 40;
      canvas.height = cardH + 40;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const loadImg = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        if (url.startsWith('http://') || url.startsWith('https://')) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = url;
      });

      if (activeCard.frontCardUrl) {
        const frontImg = await loadImg(activeCard.frontCardUrl);
        ctx.drawImage(frontImg, 20, 20, cardW, cardH);
      }
      if (activeCard.backCardUrl) {
        const backImg = await loadImg(activeCard.backCardUrl);
        ctx.drawImage(backImg, 20 + cardW + gap, 20, cardW, cardH);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.98);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `MAHA_ID_Card_${activeCard.fileName.replace(/\.[^/.]+$/, '')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('JPG Export error:', err);
    } finally {
      setIsExportingJpg(false);
    }
  };

  // Register High-Speed Keyboard Shortcuts (Ctrl+P, Ctrl+D, Ctrl+B, etc.)
  useRegisterShortcuts({
    onPrint: () => handlePrint(printLayoutMode),
    onDownloadPdf: () => handleDownloadPdf(printLayoutMode),
    onNewCard: () => fileInputRef.current?.click(),
    onToggleView: () => setViewMode((prev) => (prev === 'both' ? 'front' : prev === 'front' ? 'back' : 'both')),
    onNextCard: () => {
      if (cards.length > 1) {
        setActiveCardIndex((prev) => Math.min(cards.length - 1, prev + 1));
      }
    },
    onPrevCard: () => {
      if (cards.length > 1) {
        setActiveCardIndex((prev) => Math.max(0, prev - 1));
      }
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hidden file input used across all upload triggers */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="application/pdf,image/*"
        className="hidden"
      />

      {/* Upload Error Alert */}
      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-red-700 flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-semibold">{uploadError}</span>
        </div>
      )}

      {/* CASE 1: NO CARDS UPLOADED -> ONE SINGLE GORGEOUS UPLOAD SECTION */}
      {cards.length === 0 ? (
        <div className="bg-gradient-to-br from-[#0c2340] via-[#103463] to-[#0a192f] rounded-3xl p-8 sm:p-14 text-white shadow-2xl border border-blue-500/30 relative overflow-hidden text-center space-y-6">
          {/* Subtle Decorative Glows */}
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs sm:text-sm font-bold text-sky-200 border border-white/20 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-300" />
            महाराष्ट्र शासन • Maha ID Direct PDF Auto-Crop
          </div>

          {/* Big Center Icon */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 border border-white/20">
            <FileUp className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-bounce-subtle" />
          </div>

          {/* Titles & Description */}
          <div className="max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Maha ID Card PDF अपलोड करा
            </h2>
            <p className="text-xs sm:text-base text-sky-100 font-medium leading-relaxed">
              कोणतीही माहिती टाईप करण्याची गरज नाही. तुमची <strong>Maha ID PDF फाईल</strong> निवडा. 
              सिस्टीम आपोआप <strong>Front व Back कार्ड्स थेट 85.6 mm × 54 mm PVC</strong> आकारात क्रॉप करेल.
            </p>
          </div>

          {/* ONE Single Prominent Upload Button */}
          <div className="pt-2 flex flex-col items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="group inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-white rounded-2xl text-base sm:text-lg font-black shadow-xl shadow-orange-500/40 hover:shadow-orange-500/60 transition-all duration-200 cursor-pointer transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                  <span>PDF वाचून क्रॉप करत आहे...</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                  <span>Maha ID PDF फाईल निवडा</span>
                </>
              )}
            </button>

            {/* Feature Highlights Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-4 text-[11px] sm:text-xs text-sky-200 font-semibold">
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                🔒 पासवर्ड सुरक्षित PDF सपोर्ट
              </span>
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                ✂️ 100% अचूक ऑटो-क्रॉप
              </span>
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                🖨️ A4 वर एकाधिक कार्ड्स प्रिंट
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* CASE 2: CARDS ARE LOADED -> COMPACT TOOLBAR + CARD PREVIEWS */
        <>
          {/* Top Bar: Active Cards & + Button */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0 py-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider px-2 shrink-0">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>कार्ड्स ({cards.length}):</span>
              </div>

              {cards.map((c, idx) => (
                <button
                  key={c.id || idx}
                  type="button"
                  onClick={() => setActiveCardIndex(idx)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeCardIndex === idx
                      ? 'bg-[#0e4e96] text-white shadow-md'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>कार्ड {idx + 1}</span>
                  <span className="truncate max-w-[120px] text-[11px] opacity-80 font-normal">
                    ({c.fileName})
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCard(idx);
                    }}
                    className="hover:text-red-300 ml-1 text-sm font-black"
                    title="हे कार्ड काढा"
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>

            {/* Prominent + Add Next PDF Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition-all shrink-0 cursor-pointer disabled:opacity-50"
              title="पुढील Maha ID PDF फाईल जोडा"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 text-white" />
              )}
              <span>+ पुढील PDF जोडा</span>
            </button>
          </div>

          {/* Main Card Preview & Actions Box */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-200/90 dark:border-slate-800 p-5 sm:p-7 space-y-6">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-slate-800 pb-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setViewMode('front')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'front' ? 'bg-[#0e4e96] text-white shadow-xs' : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Front Side
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('back')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'back' ? 'bg-[#0e4e96] text-white shadow-xs' : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Back Side
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('both')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'both' ? 'bg-[#0e4e96] text-white shadow-xs' : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Both (दोन्ही बाजू)
                  </button>
                </div>

                {/* Adjust Crop Button */}
                <button
                  type="button"
                  onClick={() => setIsCropAdjustModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  title="कार्डचा क्रॉप बॉक्स बारीक ॲडजस्ट करा"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  क्रॉप ॲडजस्ट करा
                </button>

                {/* Multi-card Layout Toggle (if > 1 card) */}
                {cards.length > 1 && (
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setPrintLayoutMode('single')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        printLayoutMode === 'single'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      सध्याचे १ कार्ड
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintLayoutMode('all-on-one-page')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        printLayoutMode === 'all-on-one-page'
                          ? 'bg-[#0e4e96] text-white shadow-xs'
                          : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Grid className="w-3 h-3" />
                      <span>सर्व {cards.length} कार्ड्स १ पानावर</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrint(printLayoutMode)}
                  disabled={isPrinting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60 shrink-0"
                  title="A4 प्रिंट काढा (Ctrl + P)"
                >
                  <Printer className="w-4 h-4 text-blue-100" />
                  <span>प्रिंट</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPdf(printLayoutMode)}
                  disabled={isExportingPdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60 shrink-0"
                  title="HD PDF डाऊनलोड करा (Ctrl + D)"
                >
                  <Download className="w-4 h-4 text-emerald-100" />
                  <span>PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJpg}
                  disabled={isExportingJpg}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60 shrink-0"
                  title="HD JPG फोटो डाऊनलोड करा"
                >
                  <ImageIcon className="w-4 h-4 text-purple-100" />
                  <span>JPG</span>
                </button>
              </div>
            </div>

            {/* Info Sub-bar */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700">
              <span className="truncate">
                सध्याचे कार्ड ({activeCardIndex + 1}/{cards.length}): <strong>{activeCard?.fileName}</strong>
              </span>
              <span>PVC आकार: <strong>85.6 mm × 54 mm (CR80)</strong></span>
            </div>

            {/* Visual Display */}
            {printLayoutMode === 'all-on-one-page' && cards.length > 1 ? (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                    📄 १ A4 पानावर सर्व {cards.length} कार्ड्सची मांडणी (All on 1 Sheet)
                  </span>
                </div>
                <div className="flex flex-col items-center gap-4 p-4 bg-slate-50/90 dark:bg-slate-800/60 rounded-2xl border border-gray-200/80 dark:border-slate-700/80">
                  {cards.map((c, idx) => (
                    <div key={c.id || idx} className="flex flex-col sm:flex-row items-center gap-3">
                      <span className="text-[11px] font-bold text-gray-400 dark:text-slate-400 w-12 text-center sm:text-right">#{idx + 1}</span>
                      <div
                        className="w-[280px] sm:w-[320px] rounded-lg overflow-hidden shadow-sm border border-gray-300 dark:border-slate-700 bg-white"
                        style={{ aspectRatio: '85.6 / 54' }}
                      >
                        {c.frontCardUrl ? (
                          <img src={c.frontCardUrl} alt={`Front ${idx}`} className="w-full h-full object-fill" />
                        ) : null}
                      </div>
                      <div
                        className="w-[280px] sm:w-[320px] rounded-lg overflow-hidden shadow-sm border border-gray-300 dark:border-slate-700 bg-white"
                        style={{ aspectRatio: '85.6 / 54' }}
                      >
                        {c.backCardUrl ? (
                          <img src={c.backCardUrl} alt={`Back ${idx}`} className="w-full h-full object-fill" />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Single Active Card Screen Preview */
              <div className="w-full flex justify-center py-2">
                {viewMode === 'both' ? (
                  <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 bg-slate-50/90 dark:bg-slate-800/60 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 justify-items-center">
                    <div className="w-full max-w-[500px] flex flex-col items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Front Side (85.6 mm × 54 mm)
                      </span>
                      <div
                        className="w-full rounded-2xl overflow-hidden shadow-xl border border-gray-300 dark:border-slate-700 bg-white"
                        style={{ aspectRatio: '85.6 / 54' }}
                      >
                        {activeCard?.frontCardUrl ? (
                          <img
                            src={activeCard.frontCardUrl}
                            alt="Front Card"
                            className="w-full h-full object-fill"
                          />
                        ) : null}
                      </div>
                    </div>

                    <div className="w-full max-w-[500px] flex flex-col items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Back Side (85.6 mm × 54 mm)
                      </span>
                      <div
                        className="w-full rounded-2xl overflow-hidden shadow-xl border border-gray-300 dark:border-slate-700 bg-white"
                        style={{ aspectRatio: '85.6 / 54' }}
                      >
                        {activeCard?.backCardUrl ? (
                          <img
                            src={activeCard.backCardUrl}
                            alt="Back Card"
                            className="w-full h-full object-fill"
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : viewMode === 'front' ? (
                  <div className="w-full flex flex-col items-center gap-2 p-4 bg-slate-50/90 dark:bg-slate-800/60 rounded-2xl border border-gray-200/80 dark:border-slate-700/80">
                    <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Front Side (85.6 mm × 54 mm)
                    </span>
                    <div
                      className="w-full max-w-[560px] rounded-2xl overflow-hidden shadow-xl border border-gray-300 dark:border-slate-700 bg-white"
                      style={{ aspectRatio: '85.6 / 54' }}
                    >
                      {activeCard?.frontCardUrl ? (
                        <img
                          src={activeCard.frontCardUrl}
                          alt="Front Card"
                          className="w-full h-full object-fill"
                        />
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center gap-2 p-4 bg-slate-50/90 dark:bg-slate-800/60 rounded-2xl border border-gray-200/80 dark:border-slate-700/80">
                    <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Back Side (85.6 mm × 54 mm)
                    </span>
                    <div
                      className="w-full max-w-[560px] rounded-2xl overflow-hidden shadow-xl border border-gray-300 dark:border-slate-700 bg-white"
                      style={{ aspectRatio: '85.6 / 54' }}
                    >
                      {activeCard?.backCardUrl ? (
                        <img
                          src={activeCard.backCardUrl}
                          alt="Back Card"
                          className="w-full h-full object-fill"
                        />
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* HIDDEN A4 SHEET FOR DIRECT NATIVE PRINTING */}
      {activeCard && (
        <div id="printable-maha-a4-sheet" className="hidden">
          <div className="a4-print-sheet">
            <div className="a4-cards-row">
              <div className="card-scaled-box">
                {activeCard.frontCardUrl ? (
                  <img
                    src={activeCard.frontCardUrl}
                    alt="Front Card Print"
                    style={{ width: '100%', height: '100%', objectFit: 'fill' }}
                  />
                ) : null}
              </div>
              <div className="card-scaled-box">
                {activeCard.backCardUrl ? (
                  <img
                    src={activeCard.backCardUrl}
                    alt="Back Card Print"
                    style={{ width: '100%', height: '100%', objectFit: 'fill' }}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN ALL CARDS ON ONE SHEET PRINT CONTAINER */}
      {cards.length > 0 && (
        <div id="printable-maha-all-a4-sheet" className="hidden">
          <div className="a4-print-sheet a4-multi-page">
            <div className="a4-cards-grid">
              {cards.slice(0, 5).map((c, idx) => (
                <div key={c.id || idx} className="a4-cards-row">
                  <div className="card-scaled-box">
                    {c.frontCardUrl ? (
                      <img
                        src={c.frontCardUrl}
                        alt={`Front Card Print ${idx}`}
                        style={{ width: '100%', height: '100%', objectFit: 'fill' }}
                      />
                    ) : null}
                  </div>
                  <div className="card-scaled-box">
                    {c.backCardUrl ? (
                      <img
                        src={c.backCardUrl}
                        alt={`Back Card Print ${idx}`}
                        style={{ width: '100%', height: '100%', objectFit: 'fill' }}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PDF PASSWORD MODAL */}
      <PdfPasswordModal
        isOpen={isPasswordModalOpen}
        fileName={pendingPasswordFile?.name || 'Maha_ID_Document.pdf'}
        errorMessage={passwordErrorMessage}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setPendingPasswordFile(null);
          setPasswordErrorMessage(null);
        }}
        onSubmit={handlePasswordSubmit}
      />

      {/* CROP ADJUST MODAL */}
      {isCropAdjustModalOpen && activeCard && (
        <PdfCropAdjustModal
          isOpen={isCropAdjustModalOpen}
          pageImageUrl={activeCard.pageImageUrl}
          frontCrop={activeCard.frontCrop}
          backCrop={activeCard.backCrop}
          onClose={() => setIsCropAdjustModalOpen(false)}
          onApplyCrop={handleApplyAdjustedCrop}
        />
      )}
    </div>
  );
};
