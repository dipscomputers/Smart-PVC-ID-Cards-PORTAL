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
  FileBadge,
  Sparkles,
  Layers,
  Vote,
  Grid,
  FileUp,
  RotateCcw,
  Eye,
  ImageIcon
} from 'lucide-react';
import { useRegisterShortcuts } from '../context/ShortcutsContext';
import { printComponent } from '../utils/printHelper';
import { 
  renderPdfFileToCanvas, 
  renderImageFileToCanvas, 
  cropCanvasToDataUrl, 
  CropBox 
} from '../utils/pdfCardCropper';
import { PdfCropAdjustModal } from './PdfCropAdjustModal';
import { PdfPasswordModal } from './PdfPasswordModal';

// Calibrated crop coordinates for official Election Commission of India e-EPIC PDF
// Front: x=5.8%, width=40.5% (removes left & right blank margin completely)
// Back: x=55.2%, width=40.5% (eliminates the large empty gap on the left side)
const ELECTORAL_FRONT_CROP: CropBox = {
  x: 5.8,
  y: 11.2,
  width: 40.5,
  height: 18.2,
};

const ELECTORAL_BACK_CROP: CropBox = {
  x: 55.2,
  y: 11.2,
  width: 40.5,
  height: 18.2,
};

export interface CroppedElectoralCard {
  id: string;
  fileName: string;
  frontCardUrl: string;
  backCardUrl: string;
  pageImageUrl: string;
  frontCrop: CropBox;
  backCrop: CropBox;
}

export const ElectoralCardSection: React.FC = () => {
  const [cards, setCards] = useState<CroppedElectoralCard[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'front' | 'back' | 'both'>('both');
  const [isUploading, setIsUploading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isCropAdjustModalOpen, setIsCropAdjustModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pendingPasswordFile, setPendingPasswordFile] = useState<File | null>(null);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | null>(null);
  const [printLayoutMode, setPrintLayoutMode] = useState<'single' | 'all-on-one-page'>('single');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeCard = cards[activeCardIndex] || cards[0] || null;

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

      const frontCardUrl = cropCanvasToDataUrl(canvas, ELECTORAL_FRONT_CROP);
      const backCardUrl = cropCanvasToDataUrl(canvas, ELECTORAL_BACK_CROP);

      const newCard: CroppedElectoralCard = {
        id: `electoral-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        fileName: file.name,
        frontCardUrl,
        backCardUrl,
        pageImageUrl,
        frontCrop: { ...ELECTORAL_FRONT_CROP },
        backCrop: { ...ELECTORAL_BACK_CROP },
      };

      setCards(prev => [...prev, newCard]);
      setActiveCardIndex(cards.length);
      setIsPasswordModalOpen(false);
      setPendingPasswordFile(null);
    } catch (err: any) {
      if (err?.isPasswordRequired) {
        setPendingPasswordFile(file);
        setIsPasswordModalOpen(true);
        if (password) {
          setPasswordErrorMessage('पासवर्ड चुकीचा आहे.');
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSingleFile(file);
    }
  };

  const handlePasswordSubmit = (enteredPassword: string) => {
    if (pendingPasswordFile) {
      processSingleFile(pendingPasswordFile, enteredPassword);
    }
  };

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

  const handleDeleteCard = (indexToDelete: number) => {
    const filtered = cards.filter((_, i) => i !== indexToDelete);
    setCards(filtered);
    if (activeCardIndex >= filtered.length) {
      setActiveCardIndex(Math.max(0, filtered.length - 1));
    }
  };

  const handlePrint = async (mode: 'single' | 'all-on-one-page' = printLayoutMode) => {
    if (cards.length === 0) return;
    setIsPrinting(true);
    try {
      const targetElementId =
        mode === 'all-on-one-page' && cards.length > 1
          ? 'printable-electoral-all-a4-sheet'
          : 'printable-electoral-a4-sheet';

      const title =
        mode === 'all-on-one-page'
          ? `Electoral_All_${cards.length}_Cards_A4`
          : `Electoral_PVC_${activeCard?.fileName.replace(/\.[^/.]+$/, '')}`;

      await printComponent(targetElementId, title);
    } catch (err) {
      console.warn('Print error:', err);
    } finally {
      setIsPrinting(false);
    }
  };

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
      const gap = 2;
      const leftMargin = (210 - (cardW * 2 + gap)) / 2;

      pdf.setDrawColor(100, 116, 139);
      pdf.setLineWidth(0.2);

      if (mode === 'all-on-one-page' && cards.length > 1) {
        const rowGap = 3.0;
        const startTop = 8.0;

        const maxCardsOnPage = Math.min(cards.length, 5);
        for (let i = 0; i < maxCardsOnPage; i++) {
          const c = cards[i];
          const topMargin = startTop + i * (cardH + rowGap);

          if (c.frontCardUrl) {
            pdf.addImage(c.frontCardUrl, 'JPEG', leftMargin, topMargin, cardW, cardH);
            pdf.rect(leftMargin, topMargin, cardW, cardH);
          }
          if (c.backCardUrl) {
            pdf.addImage(c.backCardUrl, 'JPEG', leftMargin + cardW + gap, topMargin, cardW, cardH);
            pdf.rect(leftMargin + cardW + gap, topMargin, cardW, cardH);
          }
        }
        pdf.save(`Electoral_All_${maxCardsOnPage}_Cards_A4.pdf`);
      } else if (activeCard) {
        // Single card at top with 10mm margin for PVC card tray / A4 print
        const topMargin = 10;
        if (activeCard.frontCardUrl) {
          pdf.addImage(activeCard.frontCardUrl, 'JPEG', leftMargin, topMargin, cardW, cardH);
          pdf.rect(leftMargin, topMargin, cardW, cardH);
        }
        if (activeCard.backCardUrl) {
          pdf.addImage(activeCard.backCardUrl, 'JPEG', leftMargin + cardW + gap, topMargin, cardW, cardH);
          pdf.rect(leftMargin + cardW + gap, topMargin, cardW, cardH);
        }
        pdf.save(`Electoral_PVC_${activeCard.fileName.replace(/\.[^/.]+$/, '')}.pdf`);
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
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
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
      link.download = `Electoral_Card_${activeCard.fileName.replace(/\.[^/.]+$/, '')}.jpg`;
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
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="application/pdf,image/*"
        className="hidden"
      />

      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-red-700 flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-semibold">{uploadError}</span>
        </div>
      )}

      {/* CASE 1: NO CARDS UPLOADED -> ONE SINGLE GORGEOUS UPLOAD SECTION */}
      {cards.length === 0 ? (
        <div className="bg-gradient-to-br from-[#0c2461] via-[#1e3799] to-[#0a3d62] rounded-3xl p-8 sm:p-14 text-white shadow-2xl border border-sky-400/30 relative overflow-hidden text-center space-y-6">
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs sm:text-sm font-bold text-sky-200 border border-white/20 shadow-xs">
            <Vote className="w-4 h-4 text-sky-300" />
            भारत निवडणूक आयोग • e-EPIC Electoral Card PVC Auto-Crop
          </div>

          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-sky-500/30 border border-white/20">
            <FileUp className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-bounce-subtle" />
          </div>

          <div className="max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Electoral Card (मतदार ओळखपत्र) PDF अपलोड करा
            </h2>
            <p className="text-xs sm:text-base text-sky-100 font-medium leading-relaxed">
              निवडणूक आयोगाकडून (voters.eci.gov.in) डाऊनलोड केलेली <strong>e-EPIC PDF फाईल</strong> निवडा. 
              Front आणि Back कार्ड आपोआप <strong>85.6 mm × 54 mm PVC</strong> आकारात परिपूर्ण क्रॉप होईल.
            </p>
          </div>

          <div className="pt-2 flex flex-col items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="group inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-500 hover:via-blue-600 hover:to-indigo-700 text-white rounded-2xl text-base sm:text-lg font-black shadow-xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-200 cursor-pointer transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                  <span>e-EPIC PDF वाचून क्रॉप करत आहे...</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                  <span>Electoral Card PDF फाईल निवडा</span>
                </>
              )}
            </button>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-4 text-[11px] sm:text-xs text-sky-200 font-semibold">
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                🇮🇳 e-EPIC (Voter ID) सपोर्ट
              </span>
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                ✂️ 100% तंतोतंत CR80 PVC कार्ड क्रॉपिंग
              </span>
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                🖨️ 1-क्लिक A4 प्रिंट
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* CASE 2: CARDS LOADED -> TOOLBAR + CARD PREVIEWS */
        <>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0 py-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider px-2 shrink-0">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>मतदार कार्डे ({cards.length}):</span>
              </div>

              {cards.map((c, idx) => (
                <button
                  key={c.id || idx}
                  type="button"
                  onClick={() => setActiveCardIndex(idx)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeCardIndex === idx
                      ? 'bg-blue-800 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200'
                  }`}
                >
                  <span>#{idx + 1}</span>
                  <span className="max-w-[120px] truncate">{c.fileName}</span>
                  {cards.length > 1 && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCard(idx);
                      }}
                      className="hover:text-red-300 ml-1 cursor-pointer"
                      title="काढून टाका"
                    >
                      ×
                    </span>
                  )}
                </button>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                <span>आणखी PDF जोडा</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCropAdjustModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="क्रॉप बॉक्स ॲडजस्ट करा"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>क्रॉप ॲडजस्ट</span>
              </button>
            </div>
          </div>

          {/* VIEW CONTROLS & PRINT/DOWNLOAD ACTIONS */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* Front / Back / Both switch */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode('front')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'front' ? 'bg-blue-800 text-white shadow-xs' : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Front
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('back')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'back' ? 'bg-blue-800 text-white shadow-xs' : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('both')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'both' ? 'bg-blue-800 text-white shadow-xs' : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Both
                </button>
              </div>

              {/* Layout Switch (if multiple cards) */}
              {cards.length > 1 && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPrintLayoutMode('all-on-one-page')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      printLayoutMode === 'all-on-one-page'
                        ? 'bg-blue-800 text-white shadow-xs'
                        : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>सर्व {cards.length} कार्डे (A4)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintLayoutMode('single')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      printLayoutMode === 'single'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    १ कार्ड
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

          {/* VISUAL CARDS PREVIEW CANVAS */}
          <div className="bg-slate-100/80 dark:bg-slate-900/90 rounded-3xl p-6 sm:p-10 border border-gray-200/80 dark:border-slate-800 flex flex-col items-center justify-center min-h-[360px]">
            {activeCard && (
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-4xl">
                {/* Front Side */}
                {(viewMode === 'front' || viewMode === 'both') && (
                  <div className="flex flex-col items-center gap-2 w-full max-w-[390px]">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-wider">
                      Front Side (85.6 mm × 54 mm)
                    </span>
                    <div
                      className="w-full bg-white rounded-xl shadow-md border-2 border-slate-400 overflow-hidden relative ring-1 ring-slate-300/60"
                      style={{ aspectRatio: '85.6 / 54' }}
                    >
                      <img
                        src={activeCard.frontCardUrl}
                        alt="Electoral Card Front"
                        className="w-full h-full object-cover select-none"
                      />
                    </div>
                  </div>
                )}

                {/* Back Side */}
                {(viewMode === 'back' || viewMode === 'both') && (
                  <div className="flex flex-col items-center gap-2 w-full max-w-[390px]">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-wider">
                      Back Side (85.6 mm × 54 mm)
                    </span>
                    <div
                      className="w-full bg-white rounded-xl shadow-md border-2 border-slate-400 overflow-hidden relative ring-1 ring-slate-300/60"
                      style={{ aspectRatio: '85.6 / 54' }}
                    >
                      <img
                        src={activeCard.backCardUrl}
                        alt="Electoral Card Back"
                        className="w-full h-full object-cover select-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* HIDDEN PRINT CONTAINERS (Exact 10mm Top Margin for PVC Print) */}
      {/* 1. SINGLE CARD A4 PRINT */}
      {activeCard && (
        <div id="printable-electoral-a4-sheet" className="hidden">
          <style
            dangerouslySetInnerHTML={{
              __html: `
              @page {
                size: A4 portrait;
                margin: 0 !important;
              }
              @media print {
                html, body {
                  width: 210mm !important;
                  height: 297mm !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                }
                .electoral-print-sheet {
                  width: 210mm !important;
                  height: 297mm !important;
                  padding-top: 10mm !important;
                  box-sizing: border-box !important;
                  display: flex !important;
                  flex-direction: column !important;
                  align-items: center !important;
                  justify-content: flex-start !important;
                  background: #ffffff !important;
                }
                .electoral-row {
                  display: flex !important;
                  flex-direction: row !important;
                  align-items: flex-start !important;
                  justify-content: center !important;
                  gap: 2mm !important;
                  width: 100% !important;
                }
                .electoral-card-box {
                  width: 85.6mm !important;
                  height: 54.0mm !important;
                  border: 0.3mm solid #475569 !important;
                  box-sizing: border-box !important;
                  overflow: hidden !important;
                }
                .electoral-card-box img {
                  width: 100% !important;
                  height: 100% !important;
                  object-fit: cover !important;
                  display: block !important;
                }
              }
            `,
            }}
          />
          <div className="electoral-print-sheet">
            <div className="electoral-row">
              <div className="electoral-card-box">
                <img src={activeCard.frontCardUrl} alt="Front" />
              </div>
              <div className="electoral-card-box">
                <img src={activeCard.backCardUrl} alt="Back" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MULTI-CARDS ON 1 A4 SHEET (Up to 5 cards / 10 sides) */}
      {cards.length > 0 && (
        <div id="printable-electoral-all-a4-sheet" className="hidden">
          <style
            dangerouslySetInnerHTML={{
              __html: `
              @page {
                size: A4 portrait;
                margin: 0 !important;
              }
              @media print {
                html, body {
                  width: 210mm !important;
                  height: 297mm !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                }
                .electoral-all-sheet {
                  width: 210mm !important;
                  height: 297mm !important;
                  padding-top: 8mm !important;
                  box-sizing: border-box !important;
                  display: flex !important;
                  flex-direction: column !important;
                  align-items: center !important;
                  gap: 3mm !important;
                  background: #ffffff !important;
                }
                .electoral-multi-row {
                  display: flex !important;
                  flex-direction: row !important;
                  align-items: flex-start !important;
                  justify-content: center !important;
                  gap: 2mm !important;
                  width: 100% !important;
                }
                .electoral-multi-box {
                  width: 85.6mm !important;
                  height: 54.0mm !important;
                  border: 0.3mm solid #475569 !important;
                  box-sizing: border-box !important;
                  overflow: hidden !important;
                }
                .electoral-multi-box img {
                  width: 100% !important;
                  height: 100% !important;
                  object-fit: cover !important;
                  display: block !important;
                }
              }
            `,
            }}
          />
          <div className="electoral-all-sheet">
            {cards.slice(0, 5).map((c, idx) => (
              <div key={c.id || idx} className="electoral-multi-row">
                <div className="electoral-multi-box">
                  <img src={c.frontCardUrl} alt={`Front ${idx + 1}`} />
                </div>
                <div className="electoral-multi-box">
                  <img src={c.backCardUrl} alt={`Back ${idx + 1}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CROP ADJUST MODAL */}
      {isCropAdjustModalOpen && activeCard && (
        <PdfCropAdjustModal
          isOpen={isCropAdjustModalOpen}
          pageImageUrl={activeCard.pageImageUrl}
          frontCrop={activeCard.frontCrop}
          backCrop={activeCard.backCrop}
          title="मतदार कार्ड क्रॉप ॲडजस्ट करा (Fine-tune Crop)"
          onApplyCrop={handleApplyAdjustedCrop}
          onClose={() => setIsCropAdjustModalOpen(false)}
        />
      )}

      {/* PASSWORD MODAL */}
      {isPasswordModalOpen && pendingPasswordFile && (
        <PdfPasswordModal
          isOpen={isPasswordModalOpen}
          fileName={pendingPasswordFile.name}
          errorMessage={passwordErrorMessage}
          onSubmit={handlePasswordSubmit}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setPendingPasswordFile(null);
            setPasswordErrorMessage(null);
          }}
        />
      )}
    </div>
  );
};
