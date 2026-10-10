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
  CreditCard,
  Grid,
  Sprout,
  FileCheck,
  Scissors
} from 'lucide-react';
import { printComponent } from '../utils/printHelper';
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

export interface CroppedFarmerCard {
  id: string;
  fileName: string;
  frontCardUrl: string;
  backCardUrl: string;
  pageImageUrl: string;
  frontCrop: CropBox;
  backCrop: CropBox;
}

interface FarmerIdCardCropperSectionProps {
  onSwitchToForm?: () => void;
}

export const FarmerIdCardCropperSection: React.FC<FarmerIdCardCropperSectionProps> = ({ onSwitchToForm }) => {
  const [cards, setCards] = useState<CroppedFarmerCard[]>([]);
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

      // Crop Front and Back cards using calibrated coordinates into 85.6 mm x 54 mm (1012x638) PVC size
      const frontCardUrl = cropCanvasToDataUrl(canvas, DEFAULT_FRONT_CROP);
      const backCardUrl = cropCanvasToDataUrl(canvas, DEFAULT_BACK_CROP);

      const newCard: CroppedFarmerCard = {
        id: `farmer-crop-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
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
        mode === 'all-on-one-page'
          ? 'printable-farmer-cropped-all-cards'
          : 'printable-farmer-cropped-a4-sheet';

      const title =
        mode === 'all-on-one-page'
          ? `Farmer_ID_All_${cards.length}_Cards_A4`
          : `Farmer_ID_PVC_${activeCard?.fileName.replace(/\.[^/.]+$/, '')}`;

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
      const leftMargin = (210 - (cardW * 2 + gap)) / 2; // exactly centered horizontally: 18.4 mm

      if (mode === 'all-on-one-page' && cards.length > 1) {
        const rowGap = 3.0;
        const startTop = 8.0;

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
        pdf.save(`Farmer_ID_All_${maxCardsOnPage}_Cards_A4.pdf`);
      } else if (activeCard) {
        const topMargin = 10; // Exact 10 mm top margin as requested
        if (activeCard.frontCardUrl) {
          pdf.addImage(activeCard.frontCardUrl, 'JPEG', leftMargin, topMargin, cardW, cardH);
        }
        if (activeCard.backCardUrl) {
          pdf.addImage(activeCard.backCardUrl, 'JPEG', leftMargin + cardW + gap, topMargin, cardW, cardH);
        }
        pdf.save(`Farmer_ID_PVC_${activeCard.fileName.replace(/\.[^/.]+$/, '')}.pdf`);
      }

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="application/pdf,image/*"
        className="hidden"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1e5631] via-[#246b3c] to-[#1e5631] text-white p-6 rounded-2xl shadow-lg border border-green-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 rounded-full text-xs font-semibold tracking-wide uppercase mb-2 backdrop-blur-xs">
              <Sprout className="w-3.5 h-3.5 text-yellow-300" />
              <span>शेती परिचय पत्र • 85.6 mm × 54 mm PVC ऑटो-क्रॉप</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Farmer ID Card PDF / इमेज क्रॉप
            </h1>
            <p className="text-sm text-green-100 mt-1 max-w-2xl">
              शेतकरी ओळखपत्र (AgriStack / शेती परिचय पत्र) PDF किंवा फोटो अपलोड करा. फ्रंट आणि बॅक कार्ड्स थेट अधिकृत <span className="font-bold text-yellow-200">85.6 mm × 54.0 mm CR80 PVC</span> आकारात अचूक क्रॉप होऊन A4 वर प्रिंटिंगसाठी तयार होतील.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-5 py-3 bg-yellow-400 hover:bg-yellow-300 text-green-950 font-black text-sm rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>प्रक्रिया सुरू आहे...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Farmer ID PDF निवडा</span>
                </>
              )}
            </button>

            {onSwitchToForm && (
              <button
                type="button"
                onClick={onSwitchToForm}
                className="inline-flex items-center gap-2 px-4 py-3 bg-white/15 hover:bg-white/25 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>नोंदणी अर्ज भरा</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* When no card is uploaded yet */}
      {cards.length === 0 && !isUploading && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-emerald-300 hover:border-emerald-600 bg-emerald-50/40 hover:bg-emerald-50/70 transition-all rounded-2xl p-12 text-center cursor-pointer flex flex-col items-center justify-center space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-[#1e5631] border border-emerald-200">
            <Upload className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Farmer ID Card (शेती परिचय पत्र) PDF किंवा इमेज येथे ड्रॉप करा
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              क्लिक करून फाईल निवडा • PDF, JPG, PNG फॉरमॅट स्वीकारले जातील
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-white px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-2xs">
            <Scissors className="w-3.5 h-3.5 text-emerald-600" />
            <span>85.6 mm × 54.0 mm PVC CR80 स्टँडर्ड आकारात ऑटो-क्रॉप</span>
          </div>
        </div>
      )}

      {/* Main Workspace when cards are loaded */}
      {cards.length > 0 && (
        <>
          {/* Card selector bar for multiple cards */}
          {cards.length > 1 && (
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
                  अपलोड केलेली कार्डे ({cards.length}):
                </span>
                {cards.map((c, idx) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCardIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                      idx === activeCardIndex
                        ? 'bg-[#1e5631] text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span>कार्ड #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCard(idx);
                      }}
                      className="hover:text-red-300 p-0.5"
                      title="हटवा"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>आणखी कार्ड जोडा</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('both')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'both' ? 'bg-[#1e5631] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                दोन्ही बाजू (Front & Back)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('front')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'front' ? 'bg-[#1e5631] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Front
              </button>
              <button
                type="button"
                onClick={() => setViewMode('back')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'back' ? 'bg-[#1e5631] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Back
              </button>
            </div>

            {/* Layout Mode (Single vs Multi) */}
            {cards.length > 1 && (
              <div className="flex items-center gap-1 bg-emerald-50 p-1 rounded-xl border border-emerald-200">
                <button
                  type="button"
                  onClick={() => setPrintLayoutMode('single')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    printLayoutMode === 'single'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-emerald-900 hover:bg-emerald-100/70'
                  }`}
                >
                  फक्त सक्रिय कार्ड (1 Card)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintLayoutMode('all-on-one-page')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    printLayoutMode === 'all-on-one-page'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-emerald-900 hover:bg-emerald-100/70'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>सर्व {cards.length} कार्डे एका A4 वर</span>
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCropAdjustModalOpen(true)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="कार्डचा अचूक क्रॉप भाग ॲडजस्ट करा"
              >
                <Sliders className="w-4 h-4" />
                <span>क्रॉप ॲडजस्ट करा</span>
              </button>

              <button
                type="button"
                onClick={() => handlePrint(printLayoutMode)}
                disabled={isPrinting}
                className="px-4 py-2 bg-[#1e5631] hover:bg-[#164325] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isPrinting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Printer className="w-4 h-4 text-yellow-300" />
                )}
                <span>A4 वर प्रिंट करा</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadPdf(printLayoutMode)}
                disabled={isExportingPdf}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isExportingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : downloadSuccess ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <Download className="w-4 h-4 text-white" />
                )}
                <span>PDF डाऊनलोड करा</span>
              </button>
            </div>
          </div>

          {/* Cards Preview Section */}
          <div className="bg-slate-100 p-6 rounded-2xl border border-gray-200 flex flex-col items-center">
            {activeCard && (
              <div className="w-full flex flex-col items-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full text-xs font-bold text-gray-700 shadow-2xs border border-gray-200">
                  <Scissors className="w-3.5 h-3.5 text-[#1e5631]" />
                  <span>CR80 PVC मानक आकार: 85.6 mm × 54.0 mm • वरून १० मिमी अंतर (Top 10 mm)</span>
                </div>

                {/* Display Cards */}
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {(viewMode === 'both' || viewMode === 'front') && (
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-gray-600 mb-1.5">समोरची बाजू (Front Side)</span>
                      <div className="w-[324px] h-[204px] sm:w-[350px] sm:h-[220px] rounded-xl overflow-hidden shadow-lg border-2 border-[#1e5631] bg-white relative">
                        {activeCard.frontCardUrl ? (
                          <img
                            src={activeCard.frontCardUrl}
                            alt="Farmer ID Front"
                            className="w-full h-full object-fill block"
                          />
                        ) : null}
                      </div>
                    </div>
                  )}

                  {(viewMode === 'both' || viewMode === 'back') && (
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-gray-600 mb-1.5">मागील बाजू (Back Side)</span>
                      <div className="w-[324px] h-[204px] sm:w-[350px] sm:h-[220px] rounded-xl overflow-hidden shadow-lg border-2 border-[#1e5631] bg-white relative">
                        {activeCard.backCardUrl ? (
                          <img
                            src={activeCard.backCardUrl}
                            alt="Farmer ID Back"
                            className="w-full h-full object-fill block"
                          />
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500 font-medium text-center">
                  फाईलचे नाव: <span className="font-mono font-bold text-gray-700">{activeCard.fileName}</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* HIDDEN A4 SHEET FOR DIRECT NATIVE PRINTING */}
      {activeCard && (
        <div id="printable-farmer-cropped-a4-sheet" className="hidden">
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

      {/* HIDDEN A4 SHEET FOR PRINTING ALL CARDS ON ONE PAGE */}
      {cards.length > 0 && (
        <div id="printable-farmer-cropped-all-cards" className="hidden">
          <div className="a4-print-sheet a4-multi-page">
            <div className="a4-cards-grid">
              {cards.slice(0, 5).map((c, idx) => (
                <div key={c.id || idx} className="a4-cards-row">
                  <div className="card-scaled-box">
                    {c.frontCardUrl ? (
                      <img
                        src={c.frontCardUrl}
                        alt={`Front ${idx}`}
                        style={{ width: '100%', height: '100%', objectFit: 'fill' }}
                      />
                    ) : null}
                  </div>
                  <div className="card-scaled-box">
                    {c.backCardUrl ? (
                      <img
                        src={c.backCardUrl}
                        alt={`Back ${idx}`}
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

      {/* Crop Adjust Modal */}
      {activeCard && (
        <PdfCropAdjustModal
          isOpen={isCropAdjustModalOpen}
          pageImageUrl={activeCard.pageImageUrl}
          frontCrop={activeCard.frontCrop}
          backCrop={activeCard.backCrop}
          title="Farmer ID Card क्रॉप ॲडजस्ट करा"
          onClose={() => setIsCropAdjustModalOpen(false)}
          onApplyCrop={handleApplyAdjustedCrop}
        />
      )}

      {/* Password Modal */}
      <PdfPasswordModal
        isOpen={isPasswordModalOpen}
        fileName={pendingPasswordFile?.name || ''}
        errorMessage={passwordErrorMessage}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setPendingPasswordFile(null);
        }}
        onSubmit={handlePasswordSubmit}
      />
    </div>
  );
};
