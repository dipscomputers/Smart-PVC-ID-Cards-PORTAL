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
  HardHat,
  Grid,
  FileUp,
  FileCheck,
  Briefcase,
  ImageIcon
} from 'lucide-react';
import { useRegisterShortcuts } from '../context/ShortcutsContext';
import { printComponent } from '../utils/printHelper';
import { 
  renderPdfPagesToCanvases,
  renderImageFileToCanvas, 
  cropCanvasToDataUrl, 
  CropBox,
  ESHRAM_FRONT_CROP,
  ESHRAM_BACK_CROP
} from '../utils/pdfCardCropper';
import { PdfCropAdjustModal } from './PdfCropAdjustModal';
import { PdfPasswordModal } from './PdfPasswordModal';

export interface CroppedEShramCard {
  id: string;
  fileName: string;
  frontCardUrl: string;
  backCardUrl: string;
  pageImageUrl: string;
  backPageImageUrl?: string;
  frontCrop: CropBox;
  backCrop: CropBox;
  isMultiPage?: boolean;
}

export const EShramCardSection: React.FC = () => {
  const [cards, setCards] = useState<CroppedEShramCard[]>([]);
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
      let page1Canvas: HTMLCanvasElement;
      let page2Canvas: HTMLCanvasElement | null = null;
      let isMulti = false;

      if (file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) {
        const result = await renderPdfPagesToCanvases(file, 2, 2.5, password);
        page1Canvas = result.canvases[0];
        if (result.numPages >= 2 && result.canvases[1]) {
          page2Canvas = result.canvases[1];
          isMulti = true;
        }
      } else {
        page1Canvas = await renderImageFileToCanvas(file);
      }

      const page1ImageUrl = page1Canvas.toDataURL('image/jpeg', 0.85);
      const page2ImageUrl = page2Canvas ? page2Canvas.toDataURL('image/jpeg', 0.85) : undefined;

      const frontCrop = { ...ESHRAM_FRONT_CROP };
      const backCrop = isMulti ? { ...ESHRAM_FRONT_CROP } : { ...ESHRAM_BACK_CROP };

      const frontCardUrl = cropCanvasToDataUrl(page1Canvas, frontCrop);
      const backCardUrl = cropCanvasToDataUrl(page2Canvas || page1Canvas, backCrop);

      const newCard: CroppedEShramCard = {
        id: `eshram-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        fileName: file.name,
        frontCardUrl,
        backCardUrl,
        pageImageUrl: page1ImageUrl,
        backPageImageUrl: page2ImageUrl,
        frontCrop,
        backCrop,
        isMultiPage: isMulti,
      };

      setCards((prev) => [...prev, newCard]);
      setActiveCardIndex((prev) => (cards.length === 0 ? 0 : prev));
      setIsPasswordModalOpen(false);
      setPendingPasswordFile(null);
    } catch (err: any) {
      if (err?.isPasswordRequired) {
        setPendingPasswordFile(file);
        setIsPasswordModalOpen(true);
        if (err?.isIncorrectPassword) {
          setPasswordErrorMessage('पासवर्ड चुकीचा आहे. कृपया योग्य पासवर्ड टाका.');
        }
      } else {
        console.error('File process error:', err);
        setUploadError(`फाईल वाचताना त्रुटी आली: ${err?.message || 'अज्ञात त्रुटी'}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      await processSingleFile(file);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!pendingPasswordFile) return;
    await processSingleFile(pendingPasswordFile, password);
  };

  const handleApplyAdjustedCrop = async (frontCrop: CropBox, backCrop: CropBox) => {
    if (!activeCard) return;

    try {
      const img1 = new Image();
      img1.src = activeCard.pageImageUrl;
      await new Promise((res) => { img1.onload = res; });

      const c1 = document.createElement('canvas');
      c1.width = img1.naturalWidth || img1.width;
      c1.height = img1.naturalHeight || img1.height;
      const ctx1 = c1.getContext('2d');
      if (ctx1) ctx1.drawImage(img1, 0, 0);

      let c2 = c1;
      if (activeCard.backPageImageUrl) {
        const img2 = new Image();
        img2.src = activeCard.backPageImageUrl;
        await new Promise((res) => { img2.onload = res; });
        c2 = document.createElement('canvas');
        c2.width = img2.naturalWidth || img2.width;
        c2.height = img2.naturalHeight || img2.height;
        const ctx2 = c2.getContext('2d');
        if (ctx2) ctx2.drawImage(img2, 0, 0);
      }

      const newFrontUrl = cropCanvasToDataUrl(c1, frontCrop);
      const newBackUrl = cropCanvasToDataUrl(c2, backCrop);

      setCards((prev) =>
        prev.map((card, idx) =>
          idx === activeCardIndex
            ? {
                ...card,
                frontCardUrl: newFrontUrl,
                backCardUrl: newBackUrl,
                frontCrop,
                backCrop,
              }
            : card
        )
      );

      setIsCropAdjustModalOpen(false);
    } catch (err) {
      console.error('Crop re-render error:', err);
    }
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
          ? 'printable-eshram-all-a4-sheet'
          : 'printable-eshram-a4-sheet';

      const title =
        mode === 'all-on-one-page'
          ? `EShram_Card_All_${cards.length}_Cards_A4`
          : `EShram_Card_PVC_${activeCard?.fileName.replace(/\.[^/.]+$/, '')}`;

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

      if (mode === 'all-on-one-page' && cards.length > 1) {
        const rowGap = 3.0;
        const startTop = 6.0;

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
        pdf.save(`EShram_Card_All_${maxCardsOnPage}_Cards_A4.pdf`);
      } else if (activeCard) {
        const topMargin = 10;
        if (activeCard.frontCardUrl) {
          pdf.addImage(activeCard.frontCardUrl, 'JPEG', leftMargin, topMargin, cardW, cardH);
          pdf.rect(leftMargin, topMargin, cardW, cardH);
        }
        if (activeCard.backCardUrl) {
          pdf.addImage(activeCard.backCardUrl, 'JPEG', leftMargin + cardW + gap, topMargin, cardW, cardH);
          pdf.rect(leftMargin + cardW + gap, topMargin, cardW, cardH);
        }
        pdf.save(`EShram_Card_PVC_${activeCard.fileName.replace(/\.[^/.]+$/, '')}.pdf`);
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
      link.download = `EShram_Card_${activeCard.fileName.replace(/\.[^/.]+$/, '')}.jpg`;
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
        multiple
        className="hidden"
      />

      {uploadError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-xs sm:text-sm text-red-700 dark:text-red-300 flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-semibold">{uploadError}</span>
        </div>
      )}

      {/* CASE 1: NO CARDS UPLOADED -> ELEGANT UPLOAD HERO BANNER */}
      {cards.length === 0 ? (
        <div className="bg-gradient-to-br from-[#1e3a8a] via-[#1d4ed8] to-[#047857] rounded-3xl p-8 sm:p-14 text-white shadow-2xl border border-blue-500/30 relative overflow-hidden text-center space-y-6">
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs sm:text-sm font-bold text-blue-200 border border-white/20 shadow-xs">
            <HardHat className="w-4 h-4 text-amber-300" />
            श्रम एवं रोजगार मंत्रालय • Ministry of Labour & Employment (e-Shram)
          </div>

          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 border border-white/20">
            <FileUp className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-bounce-subtle" />
          </div>

          <div className="max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              E Shram Card PDF अपलोड करा
            </h2>
            <p className="text-xs sm:text-base text-blue-100 font-medium leading-relaxed">
              ई-श्रम पोर्टलवरून डाऊनलोड केलेली <strong>e-Shram UAN Card PDF</strong> निवडा. 
              Front व Back बाजू <strong>85.6 mm × 54 mm (CR80) स्मार्ट PVC कार्ड</strong> आकारात आपोआप कट होऊन थेट प्रिंट होईल.
            </p>
          </div>

          <div className="pt-2 flex flex-col items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 active:scale-95 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-blue-950/40 transition-all cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>PDF वाचत आहे...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-slate-950" />
                  <span>ई-श्रम कार्ड PDF निवडा (Select PDF)</span>
                </>
              )}
            </button>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-2 text-[11px] sm:text-xs text-blue-200 font-semibold">
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                👷 UAN व सर्व तपशील अचूक क्रॉप
              </span>
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                ✂️ 100% तंतोतंत PVC कार्ड कटिंग बॉर्डर
              </span>
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                🖨️ 1-क्लिक A4 प्रिंटिंग
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* CASE 2: CARDS UPLOADED -> MANAGEMENT TOOLBAR + PREVIEW + CONTROLS */
        <>
          {/* Top Multi-Card Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 max-w-full">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider px-1 shrink-0">
                <HardHat className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>ई-श्रम कार्ड्स ({cards.length}):</span>
              </div>
              {cards.map((c, idx) => (
                <button
                  key={c.id || idx}
                  type="button"
                  onClick={() => setActiveCardIndex(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    activeCardIndex === idx
                      ? 'bg-blue-700 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <HardHat className="w-3.5 h-3.5" />
                  <span>कार्ड #{idx + 1}</span>
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

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-700/20 transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 text-white" />
              )}
              <span>+ पुढील ई-श्रम कार्ड जोडा</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-200/90 dark:border-slate-800 p-5 sm:p-7 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-slate-800 pb-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setViewMode('front')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'front' ? 'bg-blue-700 text-white shadow-xs' : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Front Side
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('back')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'back' ? 'bg-blue-700 text-white shadow-xs' : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Back Side
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('both')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'both' ? 'bg-blue-700 text-white shadow-xs' : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Both (दोन्ही बाजू)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCropAdjustModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-800 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  क्रॉप ॲडजस्ट करा
                </button>

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
                          ? 'bg-blue-700 text-white shadow-xs'
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

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700">
              <span className="truncate">
                सध्याचे कार्ड ({activeCardIndex + 1}/{cards.length}): <strong>{activeCard?.fileName}</strong> {activeCard?.isMultiPage ? '• (२-पाने PDF)' : ''}
              </span>
              <span>PVC आकार: <strong>85.6 mm × 54 mm (CR80)</strong></span>
            </div>

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
                        <img src={activeCard.frontCardUrl} alt="e-Shram Front" className="w-full h-full object-fill" />
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
                        <img src={activeCard.backCardUrl} alt="e-Shram Back" className="w-full h-full object-fill" />
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
                      <img src={activeCard.frontCardUrl} alt="e-Shram Front" className="w-full h-full object-fill" />
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
                      <img src={activeCard.backCardUrl} alt="e-Shram Back" className="w-full h-full object-fill" />
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* HIDDEN PRINT CONTAINERS (A4 PVC Printing Tray & Full Sheet) */}
      {activeCard && (
        <div id="printable-eshram-a4-sheet" className="hidden">
          <div className="a4-print-sheet">
            <div className="a4-cards-row">
              <div className="card-scaled-box">
                {activeCard.frontCardUrl ? (
                  <img src={activeCard.frontCardUrl} alt="Front Print" style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
                ) : null}
              </div>
              <div className="card-scaled-box">
                {activeCard.backCardUrl ? (
                  <img src={activeCard.backCardUrl} alt="Back Print" style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {cards.length > 0 && (
        <div id="printable-eshram-all-a4-sheet" className="hidden">
          <div className="a4-print-sheet a4-multi-page">
            <div className="a4-cards-grid">
              {cards.slice(0, 5).map((c, idx) => (
                <div key={c.id || idx} className="a4-cards-row">
                  <div className="card-scaled-box">
                    {c.frontCardUrl ? (
                      <img src={c.frontCardUrl} alt={`Front ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
                    ) : null}
                  </div>
                  <div className="card-scaled-box">
                    {c.backCardUrl ? (
                      <img src={c.backCardUrl} alt={`Back ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <PdfPasswordModal
        isOpen={isPasswordModalOpen}
        fileName={pendingPasswordFile?.name || 'eShram_Document.pdf'}
        errorMessage={passwordErrorMessage}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setPendingPasswordFile(null);
          setPasswordErrorMessage(null);
        }}
        onSubmit={handlePasswordSubmit}
      />

      {isCropAdjustModalOpen && activeCard && (
        <PdfCropAdjustModal
          isOpen={isCropAdjustModalOpen}
          pageImageUrl={activeCard.pageImageUrl}
          backPageImageUrl={activeCard.backPageImageUrl}
          frontCrop={activeCard.frontCrop}
          backCrop={activeCard.backCrop}
          title="E Shram कार्ड क्रॉप ॲडजस्ट करा"
          onClose={() => setIsCropAdjustModalOpen(false)}
          onApplyCrop={handleApplyAdjustedCrop}
        />
      )}
    </div>
  );
};
